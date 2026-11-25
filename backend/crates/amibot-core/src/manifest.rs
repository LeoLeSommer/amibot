use std::collections::BTreeMap;
use std::sync::Arc;

use semver::Version;
use serde::Serialize;

use crate::client_version::{API_VERSION, MIN_CLIENT_API_VERSION};
use crate::descriptor::{Module, Platform, UiContribution};
use crate::error::{AmibotError, AmibotResult};
use crate::id::{CapabilityId, ContributionId, ModuleId, PermissionId, SlotId};
use crate::ui::{UiEntry, UiRegistry};

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct Manifest {
    pub api_version: u32,
    pub core: CoreInfo,
    pub server: ServerInfo,
    pub compatibility: Compatibility,
    pub modules: Vec<ManifestModule>,
    pub capabilities: Vec<ManifestCapability>,
    pub ui: UiManifest,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct CoreInfo {
    pub version: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct ServerInfo {
    pub name: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct Compatibility {
    pub min_client_api_version: u32,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct ManifestModule {
    pub id: ModuleId,
    pub name: String,
    pub version: String,
    pub permissions: Vec<PermissionId>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct ManifestCapability {
    pub id: CapabilityId,
    pub module: ModuleId,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct UiManifest {
    pub slots: BTreeMap<SlotId, Vec<SlotContribution>>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct SlotContribution {
    pub id: ContributionId,
    pub module: ModuleId,
    pub component: String,
    pub order: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platforms: Option<Vec<Platform>>,
    pub permissions: Vec<PermissionId>,
    pub props: serde_json::Value,
}

impl From<&UiEntry> for SlotContribution {
    fn from(entry: &UiEntry) -> Self {
        let UiContribution {
            id,
            component,
            order,
            platforms,
            permissions,
            props,
            ..
        } = &entry.contribution;

        Self {
            id: id.clone(),
            module: entry.module.clone(),
            component: component.clone(),
            order: *order,
            platforms: platforms.clone(),
            permissions: permissions.clone(),
            props: props.clone(),
        }
    }
}

pub struct ManifestBuilder {
    core_version: Version,
    server_name: String,
    modules: Vec<Arc<dyn Module>>,
}

impl ManifestBuilder {
    pub fn new(core_version: Version, server_name: impl Into<String>) -> Self {
        Self {
            core_version,
            server_name: server_name.into(),
            modules: Vec::new(),
        }
    }

    pub fn with_modules(mut self, modules: Vec<Arc<dyn Module>>) -> Self {
        self.modules = modules;
        self
    }

    pub fn build(self) -> AmibotResult<Manifest> {
        let ui = UiRegistry::from_modules(&self.modules)?;

        let mut modules: Vec<ManifestModule> = self
            .modules
            .iter()
            .map(|module| {
                let descriptor = module.descriptor();
                let permissions: Vec<PermissionId> = descriptor
                    .permissions
                    .iter()
                    .cloned()
                    .collect::<std::collections::BTreeSet<_>>()
                    .into_iter()
                    .collect();

                ManifestModule {
                    id: descriptor.id.clone(),
                    name: descriptor.name.clone(),
                    version: descriptor.version.to_string(),
                    permissions,
                }
            })
            .collect();
        modules.sort_by(|left, right| left.id.cmp(&right.id));

        let mut capabilities: BTreeMap<CapabilityId, ModuleId> = BTreeMap::new();
        for module in &self.modules {
            let descriptor = module.descriptor();
            for capability in &descriptor.capabilities {
                if capabilities
                    .insert(capability.clone(), descriptor.id.clone())
                    .is_some()
                {
                    return Err(AmibotError::DuplicateCapability {
                        capability: capability.to_string(),
                        module: descriptor.id.to_string(),
                    });
                }
            }
        }

        let capabilities = capabilities
            .into_iter()
            .map(|(id, module)| ManifestCapability { id, module })
            .collect();

        let slots = ui
            .slots()
            .iter()
            .map(|(slot, entries)| {
                (
                    slot.clone(),
                    entries.iter().map(SlotContribution::from).collect(),
                )
            })
            .collect();

        Ok(Manifest {
            api_version: API_VERSION,
            core: CoreInfo {
                version: self.core_version.to_string(),
            },
            server: ServerInfo {
                name: self.server_name,
            },
            compatibility: Compatibility {
                min_client_api_version: MIN_CLIENT_API_VERSION,
            },
            modules,
            capabilities,
            ui: UiManifest { slots },
        })
    }
}

pub fn build_manifest(
    core_version: Version,
    server_name: &str,
    modules: Vec<Arc<dyn Module>>,
) -> AmibotResult<Manifest> {
    ManifestBuilder::new(core_version, server_name)
        .with_modules(modules)
        .build()
}

#[cfg(test)]
mod tests {
    use semver::VersionReq;

    use super::*;
    use crate::descriptor::{ModuleDescriptor, UiContribution};

    struct TestModule {
        descriptor: ModuleDescriptor,
    }

    impl Module for TestModule {
        fn descriptor(&self) -> &ModuleDescriptor {
            &self.descriptor
        }
    }

    fn module(id: &str, capability: &str) -> TestModule {
        TestModule {
            descriptor: ModuleDescriptor {
                id: ModuleId::new(id).expect("valid module id"),
                name: "Chat".to_string(),
                version: Version::new(0, 1, 0),
                core: VersionReq::parse("^0.1").expect("valid requirement"),
                dependencies: Vec::new(),
                capabilities: vec![CapabilityId::new(capability).expect("valid capability")],
                permissions: vec![
                    PermissionId::new("chat.write").expect("valid permission"),
                    PermissionId::new("chat.read").expect("valid permission"),
                ],
                ui: vec![
                    UiContribution::new(
                        ContributionId::new("new_conversation").expect("valid contribution"),
                        SlotId::new("app.header").expect("valid slot"),
                        "Button",
                        10,
                        Some(vec![Platform::Web, Platform::Ios]),
                        vec![PermissionId::new("chat.write").expect("valid permission")],
                        serde_json::json!({ "labelKey": "chat.newConversation" }),
                    )
                    .expect("valid contribution"),
                ],
            },
        }
    }

    #[test]
    fn serializes_the_empty_manifest() {
        let manifest = build_manifest(
            Version::parse("0.1.0").expect("valid version"),
            "Amibot",
            Vec::new(),
        )
        .expect("manifest builds");

        assert_eq!(
            serde_json::to_value(&manifest).expect("serializes"),
            serde_json::json!({
                "api_version": 1,
                "core": { "version": "0.1.0" },
                "server": { "name": "Amibot" },
                "compatibility": { "min_client_api_version": 1 },
                "modules": [],
                "capabilities": [],
                "ui": { "slots": {} }
            })
        );
    }

    #[test]
    fn serializes_a_module_with_capabilities_and_slots() {
        let modules: Vec<Arc<dyn Module>> = vec![
            Arc::new(module("amibot_chat", "chat.messages")),
            Arc::new(module("amibot_other", "other.messages")),
        ];
        let manifest = build_manifest(
            Version::parse("0.1.0").expect("valid version"),
            "Amibot",
            modules,
        )
        .expect("manifest builds");

        let value = serde_json::to_value(&manifest).expect("serializes");
        assert_eq!(value["modules"][0]["id"], "amibot_chat");
        assert_eq!(value["modules"][1]["id"], "amibot_other");
        assert_eq!(
            value["modules"][0]["permissions"],
            serde_json::json!(["chat.read", "chat.write"])
        );
        assert_eq!(value["capabilities"][0]["id"], "chat.messages");
        assert_eq!(value["capabilities"][0]["module"], "amibot_chat");
        assert_eq!(value["capabilities"][1]["module"], "amibot_other");
        assert_eq!(
            value["ui"]["slots"]["app.header"][0]["platforms"],
            serde_json::json!(["web", "ios"])
        );
        assert_eq!(
            value["ui"]["slots"]["app.header"][1]["module"],
            "amibot_other"
        );
    }

    #[test]
    fn rejects_duplicate_capabilities_at_build_time() {
        let modules: Vec<Arc<dyn Module>> = vec![
            Arc::new(module("amibot_chat", "chat.messages")),
            Arc::new(module("amibot_other", "chat.messages")),
        ];

        let error = build_manifest(
            Version::parse("0.1.0").expect("valid version"),
            "Amibot",
            modules,
        )
        .expect_err("duplicate capability rejected");

        assert!(matches!(error, AmibotError::DuplicateCapability { .. }));
    }

    #[test]
    fn contribution_order_is_deterministic() {
        let modules: Vec<Arc<dyn Module>> = vec![
            Arc::new(module("amibot_other", "other.messages")),
            Arc::new(module("amibot_chat", "chat.messages")),
        ];
        let manifest = build_manifest(
            Version::parse("0.1.0").expect("valid version"),
            "Amibot",
            modules,
        )
        .expect("manifest builds");

        let slot = SlotId::new("app.header").expect("valid slot");
        let entries = &manifest.ui.slots[&slot];
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].module.as_str(), "amibot_chat");
        assert_eq!(entries[1].module.as_str(), "amibot_other");
        assert_eq!(
            serde_json::to_string(&manifest).expect("serializes"),
            serde_json::to_string(&manifest).expect("serializes again")
        );
    }
}
