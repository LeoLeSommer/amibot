use std::sync::Arc;

use amibot_chat::{ChatModule, ChatSettings};
use amibot_runtime::RuntimeModule;
use amibot_settings::SettingsStore;
use anyhow::Result;

/// The single wiring point for official modules. Add future runtime modules
/// here; registration and routing follow automatically. A module is mounted
/// only when its settings enable it, so a disabled chat module also removes
/// its `/chat` routes from this server.
pub fn modules(settings: &SettingsStore) -> Result<Vec<Arc<dyn RuntimeModule>>> {
    let mut modules: Vec<Arc<dyn RuntimeModule>> = Vec::new();

    if let Some(chat) = ChatSettings::load(settings)?
        && chat.enabled
    {
        chat.validate()?;
        modules.push(Arc::new(ChatModule::new(chat)?));
    }

    Ok(modules)
}

#[cfg(test)]
mod tests {
    use crate::app::Config;

    use super::*;

    const YAML: &str = include_str!("../../settings.yaml");

    fn settings(enabled: &str) -> SettingsStore {
        Config::from_sources(YAML, |key| match key {
            "DATABASE_URL" => Some("postgres://amibot:amibot@db/amibot".to_string()),
            "AMIBOT_CHAT_ENABLED" => Some(enabled.to_string()),
            _ => None,
        })
        .expect("config parses")
        .settings
    }

    #[test]
    fn registers_chat_when_enabled() {
        let modules = modules(&settings("true")).expect("modules build");

        assert_eq!(modules.len(), 1);
        assert_eq!(modules[0].descriptor().id.as_str(), "amibot_chat");
    }

    #[test]
    fn skips_chat_when_disabled() {
        assert!(
            modules(&settings("false"))
                .expect("modules build")
                .is_empty()
        );
    }
}
