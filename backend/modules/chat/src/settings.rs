use amibot_settings::{SettingsError, SettingsScope, SettingsStore};
use serde::de::Error as DeError;
use serde::{Deserialize, Deserializer, Serialize};

/// A model exposed by `GET /chat/models` and accepted by `POST /chat`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ModelSetting {
    pub id: String,
    pub label: String,
}

/// The deserialized `chat:` section of the root settings file. The API key may
/// be blank: that is a valid startup state and yields `chat_not_configured` at
/// request time rather than failing the server.
#[derive(Clone, Debug, Deserialize)]
pub struct ChatSettings {
    #[serde(deserialize_with = "bool_from_scalar")]
    pub enabled: bool,
    pub provider: String,
    pub base_url: String,
    pub api_key: String,
    pub models: Vec<ModelSetting>,
    pub default_model: String,
    pub preprompt: String,
}

impl ChatSettings {
    /// Loads the module's own section without touching the environment.
    pub fn load(store: &SettingsStore) -> Result<Option<Self>, SettingsError> {
        store.section(SettingsScope::Root, "chat")
    }

    /// Validates the shape that the rest of the module relies on. Only field
    /// names appear in errors; no resolved configuration value is ever echoed.
    pub fn validate(&self) -> Result<(), SettingsError> {
        if self.provider != "opencode-go" {
            return Err(SettingsError::InvalidSection("chat.provider".to_string()));
        }
        if self.base_url.trim().is_empty() {
            return Err(SettingsError::InvalidSection("chat.base_url".to_string()));
        }
        if self.preprompt.trim().is_empty() {
            return Err(SettingsError::InvalidSection("chat.preprompt".to_string()));
        }
        if self.models.is_empty() {
            return Err(SettingsError::InvalidSection("chat.models".to_string()));
        }

        let mut seen = std::collections::BTreeSet::new();
        for model in &self.models {
            if model.id.trim().is_empty() || !seen.insert(model.id.as_str()) {
                return Err(SettingsError::InvalidSection("chat.models".to_string()));
            }
        }

        if !seen.contains(self.default_model.as_str()) {
            return Err(SettingsError::InvalidSection(
                "chat.default_model".to_string(),
            ));
        }

        Ok(())
    }

    pub fn is_model_known(&self, model: &str) -> bool {
        self.models.iter().any(|entry| entry.id == model)
    }
}

/// `${VAR}` interpolation always yields a YAML string, so `enabled` may arrive
/// as `"true"`/`"false"`; also accept a native YAML boolean.
fn bool_from_scalar<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Scalar {
        Bool(bool),
        Text(String),
    }

    match Scalar::deserialize(deserializer)? {
        Scalar::Bool(value) => Ok(value),
        Scalar::Text(text) => match text.trim().to_ascii_lowercase().as_str() {
            "true" => Ok(true),
            "false" => Ok(false),
            _ => Err(D::Error::custom("expected a boolean")),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const YAML: &str = "chat:\n  enabled: ${CHAT_ENABLED:-true}\n  provider: opencode-go\n  base_url: https://example.invalid/v1/chat/completions\n  api_key: ${CHAT_KEY:-}\n  models:\n    - id: glm-flash\n      label: GLM Flash\n    - id: glm\n      label: GLM\n  default_model: glm-flash\n  preprompt: You are helpful.\n";

    fn load(values: &[(&str, &str)]) -> ChatSettings {
        let store = SettingsStore::from_yaml(YAML, |key| {
            values
                .iter()
                .find(|(name, _)| *name == key)
                .map(|(_, value)| (*value).to_string())
        })
        .expect("settings parse");
        ChatSettings::load(&store)
            .expect("section loads")
            .expect("section present")
    }

    fn valid() -> ChatSettings {
        load(&[])
    }

    #[test]
    fn loads_a_valid_section_with_interpolated_scalars() {
        let settings = valid();
        assert!(settings.enabled);
        assert_eq!(settings.api_key, "");
        assert_eq!(settings.models.len(), 2);
        assert_eq!(settings.default_model, "glm-flash");
        settings.validate().expect("valid settings");
    }

    #[test]
    fn accepts_a_native_boolean_and_an_explicit_false() {
        let disabled = load(&[("CHAT_ENABLED", "false")]);
        assert!(!disabled.enabled);

        let store = SettingsStore::from_yaml("chat:\n  enabled: false\n  provider: opencode-go\n  base_url: x\n  api_key: ''\n  models:\n    - id: a\n      label: A\n  default_model: a\n  preprompt: p\n", |_| None)
            .expect("settings parse");
        let settings = ChatSettings::load(&store)
            .expect("section loads")
            .expect("section present");
        assert!(!settings.enabled);
    }

    #[test]
    fn rejects_unknown_or_empty_provider() {
        let mut settings = valid();
        settings.provider = "other".to_string();
        assert_eq!(
            settings.validate(),
            Err(SettingsError::InvalidSection("chat.provider".to_string()))
        );
    }

    #[test]
    fn rejects_duplicate_or_empty_model_ids() {
        let mut settings = valid();
        settings.models[1].id = settings.models[0].id.clone();
        assert_eq!(
            settings.validate(),
            Err(SettingsError::InvalidSection("chat.models".to_string()))
        );

        let mut settings = valid();
        settings.models[0].id = " ".to_string();
        assert!(settings.validate().is_err());
    }

    #[test]
    fn rejects_empty_models_and_unknown_default() {
        let mut settings = valid();
        settings.models.clear();
        assert!(settings.validate().is_err());

        let mut settings = valid();
        settings.default_model = "missing".to_string();
        assert_eq!(
            settings.validate(),
            Err(SettingsError::InvalidSection(
                "chat.default_model".to_string()
            ))
        );
    }

    #[test]
    fn rejects_a_blank_preprompt_but_allows_a_blank_key() {
        let mut settings = valid();
        settings.preprompt = " ".to_string();
        assert_eq!(
            settings.validate(),
            Err(SettingsError::InvalidSection("chat.preprompt".to_string()))
        );

        let settings = valid();
        assert!(settings.api_key.is_empty());
        assert!(settings.validate().is_ok());
    }

    #[test]
    fn model_lookup_is_bounded_to_configured_ids() {
        let settings = valid();
        assert!(settings.is_model_known("glm-flash"));
        assert!(!settings.is_model_known("unknown"));
    }
}
