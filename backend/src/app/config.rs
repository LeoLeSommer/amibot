use std::net::SocketAddr;
use std::path::PathBuf;

use amibot_settings::{SettingsError, SettingsScope, SettingsStore};
use axum::http::HeaderValue;
use serde::Deserialize;
use thiserror::Error;

pub const DEFAULT_SETTINGS_FILE: &str = "settings.yaml";

const DEFAULT_BIND_ADDR: &str = "0.0.0.0:3000";
const DEFAULT_SERVER_NAME: &str = "Amibot";
const DEFAULT_WEB_DIR: &str = "../frontend/dist";

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub bind_addr: SocketAddr,
    pub server_name: String,
    pub allowed_origins: Vec<String>,
    pub web_dir: PathBuf,
    pub settings: SettingsStore,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ConfigError {
    #[error("{0} must be set")]
    Missing(&'static str),
    #[error("{0} is invalid: {1}")]
    Invalid(&'static str, String),
    #[error("AMIBOT_ALLOWED_ORIGINS must not contain '*' when credentials are enabled")]
    WildcardOrigin,
    #[error("invalid CORS origin: {0}")]
    InvalidOrigin(String),
    #[error("settings error: {0}")]
    Settings(#[from] SettingsError),
}

/// The typed `server:` section of the root settings file. All values are
/// strings because `${VAR}` interpolation always yields a YAML string scalar.
#[derive(Deserialize)]
struct ServerSettings {
    database_url: String,
    bind_addr: String,
    name: String,
    allowed_origins: String,
    web_dir: String,
}

impl Config {
    /// Loads the settings file selected by `AMIBOT_SETTINGS_FILE` (default
    /// `settings.yaml`, relative to the working directory) and resolves its
    /// `${VAR}` references from the process environment.
    pub fn from_env() -> Result<Self, ConfigError> {
        let _ = dotenvy::dotenv();
        let path = std::env::var("AMIBOT_SETTINGS_FILE")
            .ok()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| DEFAULT_SETTINGS_FILE.to_string());
        let text = std::fs::read_to_string(&path)
            .map_err(|_| ConfigError::Settings(SettingsError::MissingFile))?;
        Self::from_sources(&text, |key| std::env::var(key).ok())
    }

    /// Builds configuration from a settings document through an injectable
    /// lookup, so unit tests stay free of process-environment mutation.
    pub fn from_sources(
        yaml: &str,
        lookup: impl Fn(&str) -> Option<String>,
    ) -> Result<Self, ConfigError> {
        let settings = SettingsStore::from_yaml(yaml, lookup)?;
        Self::from_settings(settings)
    }

    fn from_settings(settings: SettingsStore) -> Result<Self, ConfigError> {
        let server: ServerSettings = settings
            .section(SettingsScope::Root, "server")?
            .ok_or_else(|| {
                ConfigError::Settings(SettingsError::InvalidSection("server".to_string()))
            })?;

        let database_url = server.database_url;
        if database_url.trim().is_empty() {
            return Err(ConfigError::Missing("DATABASE_URL"));
        }

        let bind_addr_text = blank_or(server.bind_addr, DEFAULT_BIND_ADDR);
        let bind_addr = bind_addr_text
            .parse::<SocketAddr>()
            .map_err(|_| ConfigError::Invalid("AMIBOT_BIND_ADDR", bind_addr_text.clone()))?;

        let server_name = blank_or(server.name, DEFAULT_SERVER_NAME);
        let allowed_origins = parse_origins(&server.allowed_origins)?;
        let web_dir = PathBuf::from(blank_or(server.web_dir, DEFAULT_WEB_DIR));

        Ok(Self {
            database_url,
            bind_addr,
            server_name,
            allowed_origins,
            web_dir,
            settings,
        })
    }
}

fn blank_or(value: String, default: &str) -> String {
    if value.trim().is_empty() {
        default.to_string()
    } else {
        value
    }
}

fn parse_origins(value: &str) -> Result<Vec<String>, ConfigError> {
    let mut origins = Vec::new();

    for origin in value.split(',') {
        let origin = origin.trim();
        if origin.is_empty() {
            continue;
        }
        if origin == "*" {
            return Err(ConfigError::WildcardOrigin);
        }
        if origin.parse::<HeaderValue>().is_err() {
            return Err(ConfigError::InvalidOrigin(origin.to_string()));
        }
        origins.push(origin.to_string());
    }

    Ok(origins)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SETTINGS_YAML: &str = include_str!("../../settings.yaml");

    fn config(values: &[(&str, &str)]) -> Result<Config, ConfigError> {
        Config::from_sources(SETTINGS_YAML, |key| {
            values
                .iter()
                .find(|(name, _)| *name == key)
                .map(|(_, value)| (*value).to_string())
        })
    }

    #[test]
    fn applies_defaults() {
        let config = config(&[("DATABASE_URL", "postgres://amibot:amibot@db/amibot")])
            .expect("config parses");

        assert_eq!(config.bind_addr.to_string(), "0.0.0.0:3000");
        assert_eq!(config.server_name, "Amibot");
        assert_eq!(config.allowed_origins, ["http://localhost:8081"]);
        assert_eq!(config.web_dir, PathBuf::from("../frontend/dist"));
    }

    #[test]
    fn reads_explicit_values() {
        let config = config(&[
            ("DATABASE_URL", "postgres://amibot:amibot@db/amibot"),
            ("AMIBOT_BIND_ADDR", "127.0.0.1:9000"),
            ("AMIBOT_SERVER_NAME", "Amibot Test"),
            (
                "AMIBOT_ALLOWED_ORIGINS",
                "http://localhost:8081, https://amibot.example",
            ),
            ("AMIBOT_WEB_DIR", "/srv/amibot/web"),
        ])
        .expect("config parses");

        assert_eq!(config.bind_addr.to_string(), "127.0.0.1:9000");
        assert_eq!(config.server_name, "Amibot Test");
        assert_eq!(
            config.allowed_origins,
            ["http://localhost:8081", "https://amibot.example"]
        );
        assert_eq!(config.web_dir, PathBuf::from("/srv/amibot/web"));
    }

    #[test]
    fn blank_optional_values_fall_back_to_defaults() {
        let config = config(&[
            ("DATABASE_URL", "postgres://amibot:amibot@db/amibot"),
            ("AMIBOT_BIND_ADDR", "  "),
            ("AMIBOT_SERVER_NAME", ""),
            ("AMIBOT_WEB_DIR", ""),
        ])
        .expect("config parses");

        assert_eq!(config.bind_addr.to_string(), "0.0.0.0:3000");
        assert_eq!(config.server_name, "Amibot");
        assert_eq!(config.web_dir, PathBuf::from("../frontend/dist"));
    }

    #[test]
    fn requires_a_database_url_variable() {
        assert_eq!(
            config(&[]).err().expect("database URL is required"),
            ConfigError::Settings(SettingsError::UnresolvedVariable(
                "DATABASE_URL".to_string()
            ))
        );
    }

    #[test]
    fn rejects_a_blank_database_url() {
        assert_eq!(
            config(&[("DATABASE_URL", "  ")])
                .err()
                .expect("blank database URL rejected"),
            ConfigError::Missing("DATABASE_URL")
        );
    }

    #[test]
    fn exposes_the_settings_store_for_modules() {
        #[derive(Deserialize)]
        struct ChatSection {
            enabled: String,
        }

        let config = config(&[("DATABASE_URL", "postgres://amibot:amibot@db/amibot")])
            .expect("config parses");
        let chat: Option<ChatSection> = config
            .settings
            .section(SettingsScope::Root, "chat")
            .expect("chat section loads");

        assert_eq!(chat.expect("chat section present").enabled, "true");
    }

    #[test]
    fn rejects_invalid_bind_addresses() {
        let error = config(&[
            ("DATABASE_URL", "postgres://amibot:amibot@db/amibot"),
            ("AMIBOT_BIND_ADDR", "not-an-address"),
        ])
        .err()
        .expect("invalid bind address rejected");

        assert!(matches!(error, ConfigError::Invalid("AMIBOT_BIND_ADDR", _)));
    }

    #[test]
    fn rejects_wildcard_origins() {
        let error = config(&[
            ("DATABASE_URL", "postgres://amibot:amibot@db/amibot"),
            ("AMIBOT_ALLOWED_ORIGINS", "*"),
        ])
        .err()
        .expect("wildcard origin rejected");

        assert_eq!(error, ConfigError::WildcardOrigin);
    }

    #[test]
    fn rejects_invalid_origins() {
        let error = config(&[
            ("DATABASE_URL", "postgres://amibot:amibot@db/amibot"),
            ("AMIBOT_ALLOWED_ORIGINS", "http://localhost:8081\nnope"),
        ])
        .err()
        .expect("invalid origin rejected");

        assert!(matches!(error, ConfigError::InvalidOrigin(_)));
    }

    #[test]
    fn ignores_empty_origin_entries() {
        let config = config(&[
            ("DATABASE_URL", "postgres://amibot:amibot@db/amibot"),
            ("AMIBOT_ALLOWED_ORIGINS", " , http://localhost:8081 , "),
        ])
        .expect("config parses");

        assert_eq!(config.allowed_origins, ["http://localhost:8081"]);
    }
}
