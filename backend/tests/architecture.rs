use std::collections::{BTreeMap, BTreeSet};

use cargo_metadata::{DependencyKind, MetadataCommand, Package};

const BINARY: &str = "amibot-server";

const ALLOWED: &[(&str, &[&str])] = &[
    (
        "amibot-server",
        &[
            "amibot-chat",
            "amibot-core",
            "amibot-http",
            "amibot-migrations",
            "amibot-runtime",
            "amibot-schema",
            "amibot-settings",
            "amibot-storage",
        ],
    ),
    ("amibot-core", &[]),
    ("amibot-schema", &[]),
    ("amibot-migrations", &[]),
    ("amibot-http", &["amibot-core"]),
    ("amibot-storage", &["amibot-core", "amibot-schema"]),
    ("amibot-runtime", &["amibot-core"]),
    ("amibot-settings", &[]),
    (
        "amibot-chat",
        &[
            "amibot-core",
            "amibot-http",
            "amibot-runtime",
            "amibot-settings",
        ],
    ),
];

const SOCLE: &[&str] = &[
    "amibot-core",
    "amibot-http",
    "amibot-migrations",
    "amibot-runtime",
    "amibot-schema",
    "amibot-storage",
    "amibot-settings",
];

fn metadata() -> cargo_metadata::Metadata {
    MetadataCommand::new()
        .manifest_path(concat!(env!("CARGO_MANIFEST_DIR"), "/Cargo.toml"))
        .no_deps()
        .exec()
        .expect("cargo metadata should succeed")
}

fn internal_dependencies(package: &Package) -> BTreeSet<&str> {
    package
        .dependencies
        .iter()
        .filter(|dependency| dependency.kind == DependencyKind::Normal)
        .map(|dependency| dependency.name.as_str())
        .filter(|name| *name == "amibot" || name.starts_with("amibot-"))
        .collect()
}

fn allowed() -> BTreeMap<&'static str, BTreeSet<&'static str>> {
    ALLOWED
        .iter()
        .map(|(package, dependencies)| {
            (
                *package,
                dependencies.iter().copied().collect::<BTreeSet<_>>(),
            )
        })
        .collect()
}

#[test]
fn workspace_matches_the_allowed_dependency_graph() {
    let metadata = metadata();
    let allowed = allowed();

    for package in metadata.workspace_packages() {
        let Some(expected) = allowed.get(package.name.as_str()) else {
            panic!(
                "{} is a workspace member missing from ALLOWED",
                package.name
            );
        };
        let actual = internal_dependencies(package);
        assert_eq!(
            &actual, expected,
            "unexpected internal dependencies for {}",
            package.name
        );
    }
}

#[test]
fn crates_live_under_the_expected_directory() {
    let metadata = metadata();
    let workspace_root = &metadata.workspace_root;

    for package in metadata.workspace_packages() {
        let name = package.name.as_str();
        let directory = package
            .manifest_path
            .parent()
            .expect("a package manifest has a parent directory");

        let expected = if name == BINARY {
            workspace_root.clone()
        } else if SOCLE.contains(&name) {
            workspace_root.join("crates").join(name)
        } else {
            let short = name
                .strip_prefix("amibot-")
                .unwrap_or_else(|| panic!("{name} must be named amibot-<short>"));
            workspace_root.join("modules").join(short)
        };

        assert_eq!(
            directory,
            expected.as_path(),
            "{name} must live under the expected crate directory"
        );
    }
}

#[test]
fn foundation_crates_stay_dependency_free() {
    let metadata = metadata();
    let packages = metadata.workspace_packages();

    for name in ["amibot-core", "amibot-schema", "amibot-migrations"] {
        let package = packages
            .iter()
            .find(|package| package.name == name)
            .unwrap_or_else(|| panic!("{name} is a workspace member"));
        assert!(
            internal_dependencies(package).is_empty(),
            "{name} must not depend on another internal crate"
        );
    }
}

#[test]
fn core_has_no_transport_or_database_dependencies() {
    const FORBIDDEN: &[&str] = &[
        "axum",
        "tokio",
        "sqlx",
        "sea-orm",
        "sea-orm-migration",
        "tower-http",
    ];

    let metadata = metadata();
    let package = metadata
        .workspace_packages()
        .into_iter()
        .find(|package| package.name == "amibot-core")
        .expect("amibot-core is a workspace member");

    for dependency in package
        .dependencies
        .iter()
        .filter(|dependency| dependency.kind == DependencyKind::Normal)
    {
        assert!(
            !FORBIDDEN.contains(&dependency.name.as_str()),
            "amibot-core must not depend on {}",
            dependency.name
        );
    }
}

#[test]
fn runtime_depends_only_on_core() {
    let metadata = metadata();
    let packages = metadata.workspace_packages();
    let package = packages
        .iter()
        .find(|package| package.name == "amibot-runtime")
        .expect("amibot-runtime is a workspace member");

    assert_eq!(
        internal_dependencies(package),
        BTreeSet::from(["amibot-core"]),
        "amibot-runtime must stay transport-only"
    );
}

#[test]
fn no_crate_depends_on_the_binary() {
    let metadata = metadata();

    for package in metadata.workspace_packages() {
        if package.name == BINARY {
            continue;
        }
        assert!(
            !internal_dependencies(package).contains(BINARY),
            "{} must not depend on the binary package",
            package.name
        );
    }
}

#[test]
fn allowed_graph_has_no_cycles() {
    let allowed = allowed();

    fn visit(
        node: &'static str,
        allowed: &BTreeMap<&'static str, BTreeSet<&'static str>>,
        visiting: &mut BTreeSet<&'static str>,
        visited: &mut BTreeSet<&'static str>,
    ) {
        if visited.contains(node) {
            return;
        }
        assert!(visiting.insert(node), "dependency cycle reaches {node}");
        if let Some(dependencies) = allowed.get(node) {
            for dependency in dependencies {
                let dependency: &'static str = dependency;
                visit(dependency, allowed, visiting, visited);
            }
        }
        visiting.remove(node);
        visited.insert(node);
    }

    let mut visiting = BTreeSet::new();
    let mut visited = BTreeSet::new();
    for node in allowed.keys() {
        visit(node, &allowed, &mut visiting, &mut visited);
    }
}
