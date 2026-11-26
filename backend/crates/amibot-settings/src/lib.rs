//! Root settings store.
//!
//! A settings file is a YAML mapping of named sections. The core owns only the
//! `server` section; any other section is preserved verbatim so a module can
//! deserialize its own typed configuration without a change to the core.
//! String scalars support `${VAR}` (required, errors when unset) and
//! `${VAR:-default}` (optional) interpolation. Interpolation runs on the parsed
//! YAML tree, never on the raw text, so resolved values cannot break parsing.
//! Resolved secret values are never included in errors.

use serde::de::DeserializeOwned;
use serde_yaml::Value;
use thiserror::Error;

/// Settings scopes. Only `Root` is loadable; the others are declared so the
/// type can grow without breaking callers.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum SettingsScope {
    Root,
    User,
    Project,
}

/// Settings sources. Only `File` is implemented.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum SettingsSource {
    File,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SettingsError {
    #[error("settings file is missing")]
    MissingFile,
    #[error("settings file is not valid YAML")]
    InvalidYaml,
    #[error("environment variable {0} is not set")]
    UnresolvedVariable(String),
    #[error("invalid settings section: {0}")]
    InvalidSection(String),
    #[error("settings scope is not supported")]
    UnsupportedScope,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SettingsStore {
    root: serde_yaml::Mapping,
    scope: SettingsScope,
    source: SettingsSource,
}

impl SettingsStore {
    /// Parses and interpolates a settings document. The lookup is injectable so
    /// callers stay free of environment mutation; `None` means "unset".
    pub fn from_yaml(
        text: &str,
        lookup: impl Fn(&str) -> Option<String>,
    ) -> Result<Self, SettingsError> {
        let value: Value = serde_yaml::from_str(text).map_err(|_| SettingsError::InvalidYaml)?;
        let Value::Mapping(root) = value else {
            return Err(SettingsError::InvalidYaml);
        };
        let root = interpolate_mapping(root, &lookup)?;
        Ok(Self {
            root,
            scope: SettingsScope::Root,
            source: SettingsSource::File,
        })
    }

    pub fn scope(&self) -> SettingsScope {
        self.scope
    }

    pub fn source(&self) -> SettingsSource {
        self.source
    }

    /// Deserializes a named section into a caller-owned type. This is the
    /// extension hook: unknown sections are preserved and never parsed here.
    pub fn section<T: DeserializeOwned>(
        &self,
        scope: SettingsScope,
        key: &str,
    ) -> Result<Option<T>, SettingsError> {
        if scope != SettingsScope::Root {
            return Err(SettingsError::UnsupportedScope);
        }

        match self.root.get(key) {
            None => Ok(None),
            Some(value) => serde_yaml::from_value(value.clone())
                .map(Some)
                .map_err(|_| SettingsError::InvalidSection(key.to_string())),
        }
    }
}

fn interpolate_mapping(
    map: serde_yaml::Mapping,
    lookup: &impl Fn(&str) -> Option<String>,
) -> Result<serde_yaml::Mapping, SettingsError> {
    let mut result = serde_yaml::Mapping::with_capacity(map.len());
    for (key, value) in map {
        let key = interpolate_value(key, lookup)?;
        let value = interpolate_value(value, lookup)?;
        result.insert(key, value);
    }
    Ok(result)
}

fn interpolate_value(
    value: Value,
    lookup: &impl Fn(&str) -> Option<String>,
) -> Result<Value, SettingsError> {
    match value {
        Value::String(text) => Ok(Value::String(interpolate_string(&text, lookup)?)),
        Value::Sequence(sequence) => {
            let mut result = Vec::with_capacity(sequence.len());
            for entry in sequence {
                result.push(interpolate_value(entry, lookup)?);
            }
            Ok(Value::Sequence(result))
        }
        Value::Mapping(map) => Ok(Value::Mapping(interpolate_mapping(map, lookup)?)),
        other => Ok(other),
    }
}

fn interpolate_string(
    text: &str,
    lookup: &impl Fn(&str) -> Option<String>,
) -> Result<String, SettingsError> {
    let mut result = String::with_capacity(text.len());
    let mut rest = text;

    loop {
        let Some(start) = rest.find("${") else {
            result.push_str(rest);
            break;
        };
        result.push_str(&rest[..start]);
        let after = &rest[start + 2..];
        let Some(end) = after.find('}') else {
            result.push_str(&rest[start..]);
            break;
        };
        result.push_str(&resolve(&after[..end], lookup)?);
        rest = &after[end + 1..];
    }

    Ok(result)
}

fn resolve(
    expression: &str,
    lookup: &impl Fn(&str) -> Option<String>,
) -> Result<String, SettingsError> {
    if let Some((name, default)) = expression.split_once(":-") {
        Ok(lookup(name).unwrap_or_else(|| default.to_string()))
    } else {
        lookup(expression).ok_or_else(|| SettingsError::UnresolvedVariable(expression.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use serde::Deserialize;

    use super::*;

    fn lookup(values: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let owned: Vec<(String, String)> = values
            .iter()
            .map(|(key, value)| ((*key).to_string(), (*value).to_string()))
            .collect();
        move |key| {
            owned
                .iter()
                .find(|(name, _)| name == key)
                .map(|(_, value)| value.clone())
        }
    }

    #[derive(Debug, Deserialize, PartialEq, Eq)]
    struct ServerSection {
        name: String,
        port: u16,
    }

    #[test]
    fn interpolates_required_and_default_variables() {
        let yaml =
            "server:\n  name: ${SERVER_NAME}\n  port: 3000\n  bind_addr: ${BIND:-0.0.0.0:3000}\n";
        let store = SettingsStore::from_yaml(yaml, lookup(&[("SERVER_NAME", "Edge")]))
            .expect("settings parse");

        let section: serde_yaml::Value = store
            .section(SettingsScope::Root, "server")
            .expect("section loads")
            .expect("section present");

        assert_eq!(section["name"], "Edge");
        assert_eq!(section["bind_addr"], "0.0.0.0:3000");
        assert_eq!(section["port"], 3000);
    }

    #[test]
    fn explicit_value_overrides_a_default() {
        let yaml = "server:\n  name: ${SERVER_NAME:-Amibot}\n";
        let store = SettingsStore::from_yaml(yaml, lookup(&[("SERVER_NAME", "E2E")]))
            .expect("settings parse");

        let section: serde_yaml::Value = store
            .section(SettingsScope::Root, "server")
            .expect("section loads")
            .expect("section present");
        assert_eq!(section["name"], "E2E");
    }

    #[test]
    fn errors_name_only_the_unresolved_variable() {
        let yaml = "chat:\n  api_key: ${SECRET_KEY}\n";
        let error = SettingsStore::from_yaml(yaml, lookup(&[])).expect_err("missing variable");

        assert_eq!(
            error,
            SettingsError::UnresolvedVariable("SECRET_KEY".to_string())
        );
        assert!(!error.to_string().contains("SECRET_KEY_VALUE"));
    }

    #[test]
    fn empty_default_resolves_to_an_empty_value() {
        let yaml = "chat:\n  api_key: ${OPENCODE_GO_API_KEY:-}\n";
        let store = SettingsStore::from_yaml(yaml, lookup(&[])).expect("settings parse");

        let section: serde_yaml::Value = store
            .section(SettingsScope::Root, "chat")
            .expect("section loads")
            .expect("section present");
        assert_eq!(section["api_key"], "");
    }

    #[test]
    fn unknown_sections_are_preserved_and_missing_sections_are_none() {
        let yaml = "server:\n  name: Amibot\n  port: 3000\nchat:\n  enabled: true\n";
        let store = SettingsStore::from_yaml(yaml, lookup(&[])).expect("settings parse");

        assert!(
            store
                .section::<serde_yaml::Value>(SettingsScope::Root, "chat")
                .expect("section loads")
                .is_some()
        );
        assert!(
            store
                .section::<ServerSection>(SettingsScope::Root, "missing")
                .expect("section loads")
                .is_none()
        );
    }

    #[test]
    fn typed_section_mismatch_is_reported_as_invalid_section() {
        let yaml = "server:\n  name: Amibot\n  port: not-a-number\n";
        let store = SettingsStore::from_yaml(yaml, lookup(&[])).expect("settings parse");

        assert_eq!(
            store.section::<ServerSection>(SettingsScope::Root, "server"),
            Err(SettingsError::InvalidSection("server".to_string()))
        );
    }

    #[test]
    fn unsupported_scopes_are_rejected() {
        let store = SettingsStore::from_yaml("server: {}", lookup(&[])).expect("settings parse");

        assert_eq!(
            store.section::<ServerSection>(SettingsScope::User, "server"),
            Err(SettingsError::UnsupportedScope)
        );
        assert_eq!(
            store.section::<ServerSection>(SettingsScope::Project, "server"),
            Err(SettingsError::UnsupportedScope)
        );
    }

    #[test]
    fn rejects_non_mapping_documents_and_invalid_yaml() {
        assert_eq!(
            SettingsStore::from_yaml("- a\n- b\n", lookup(&[])),
            Err(SettingsError::InvalidYaml)
        );
        assert_eq!(
            SettingsStore::from_yaml("server: [", lookup(&[])),
            Err(SettingsError::InvalidYaml)
        );
    }

    #[test]
    fn interpolates_nested_sequences_and_safe_env_values() {
        let yaml = "chat:\n  models: [\"${MODEL_A:-a}\", \"${MODEL_B}\"]\n  note: ${NOTE}\n";
        let store =
            SettingsStore::from_yaml(yaml, lookup(&[("MODEL_B", "glm"), ("NOTE", "a: b: c")]))
                .expect("settings parse");

        let section: serde_yaml::Value = store
            .section(SettingsScope::Root, "chat")
            .expect("section loads")
            .expect("section present");
        assert_eq!(section["models"][0], "a");
        assert_eq!(section["models"][1], "glm");
        assert_eq!(section["note"], "a: b: c");
    }
}
