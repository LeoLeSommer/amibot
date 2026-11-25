use std::net::SocketAddr;
use std::path::PathBuf;

use axum::http::HeaderValue;
use thiserror::Error;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub bind_addr: SocketAddr,
    pub server_name: String,
    pub allowed_origins: Vec<String>,
    pub web_dir: PathBuf,
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
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let _ = dotenvy::dotenv();
        Self::from_lookup(|key| std::env::var(key).ok())
    }

    /// Reads configuration through a lookup function so tests can avoid
    /// mutating the process environment.
    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let database_url = lookup("DATABASE_URL")
            .filter(|value| !value.trim().is_empty())
            .ok_or(ConfigError::Missing("DATABASE_URL"))?;

        let bind_addr_text = lookup("AMIBOT_BIND_ADDR")
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| "0.0.0.0:3000".to_string());
        let bind_addr = bind_addr_text
            .parse::<SocketAddr>()
            .map_err(|_| ConfigError::Invalid("AMIBOT_BIND_ADDR", bind_addr_text))?;

        let server_name = lookup("AMIBOT_SERVER_NAME")
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| "Amibot".to_string());

        let allowed_origins = parse_origins(&lookup("AMIBOT_ALLOWED_ORIGINS").unwrap_or_default())?;

        let web_dir = PathBuf::from(
            lookup("AMIBOT_WEB_DIR")
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| "../frontend/dist".to_string()),
        );

        Ok(Self {
            database_url,
            bind_addr,
            server_name,
            allowed_origins,
            web_dir,
        })
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

    fn config(values: &[(&str, &str)]) -> Result<Config, ConfigError> {
        Config::from_lookup(|key| {
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
        assert!(config.allowed_origins.is_empty());
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
    fn requires_a_database_url() {
        assert_eq!(
            config(&[]).err().expect("database URL is required"),
            ConfigError::Missing("DATABASE_URL")
        );
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
