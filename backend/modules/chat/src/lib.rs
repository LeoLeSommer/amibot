mod handlers;
mod provider;
mod settings;
mod stream;

use std::pin::Pin;
use std::sync::Arc;
use std::time::Duration;

use amibot_core::{
    CapabilityId, ContributionId, Module, ModuleDescriptor, ModuleId, PermissionId, SlotId,
    UiContribution,
};
use amibot_runtime::{AppState, RuntimeModule};
use anyhow::Result;
use axum::Extension;
use axum::Router;
use axum::routing::{get, post};
use futures_util::Stream;
use semver::{Version, VersionReq};
use serde_json::json;

pub use settings::{ChatSettings, ModelSetting};

/// One piece of upstream content. The provider's SSE `data:` frames are split
/// into reasoning and answer text by `provider.rs`; `stream.rs` maps them onto
/// AI SDK v6 reasoning and text parts.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Delta {
    Reasoning(String),
    Text(String),
}

/// A boxed stream of upstream content deltas.
pub type DeltaStream = Pin<Box<dyn Stream<Item = Result<Delta, ProviderError>> + Send>>;

/// Typed upstream failure kinds. Only these names and numeric statuses are
/// logged; upstream URLs, keys, and error bodies are never exposed.
#[derive(Debug, PartialEq, Eq)]
pub enum ProviderError {
    Request,
    Status(u16),
    Stream,
    Upstream,
}

/// Module-owned state shared by the chat handlers through an Axum `Extension`.
/// `AppState` stays unchanged.
pub struct ChatState {
    pub settings: ChatSettings,
    pub client: reqwest::Client,
}

pub struct ChatModule {
    descriptor: ModuleDescriptor,
    state: Arc<ChatState>,
}

impl ChatModule {
    pub fn new(settings: ChatSettings) -> Result<Self> {
        let descriptor = build_descriptor()?;
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()?;
        Ok(Self {
            descriptor,
            state: Arc::new(ChatState { settings, client }),
        })
    }
}

impl Module for ChatModule {
    fn descriptor(&self) -> &ModuleDescriptor {
        &self.descriptor
    }
}

impl RuntimeModule for ChatModule {
    fn api_router(&self) -> Router<AppState> {
        Router::new()
            .route("/chat/models", get(handlers::models))
            .route("/chat", post(handlers::chat))
            .layer(Extension(self.state.clone()))
    }
}

fn build_descriptor() -> Result<ModuleDescriptor> {
    Ok(ModuleDescriptor {
        id: ModuleId::new("amibot_chat")?,
        name: "Chat".to_string(),
        version: Version::parse("0.1.0")?,
        core: VersionReq::parse("^0.1")?,
        dependencies: Vec::new(),
        capabilities: vec![CapabilityId::new("chat.messages")?],
        permissions: vec![
            PermissionId::new("chat.read")?,
            PermissionId::new("chat.write")?,
        ],
        ui: vec![UiContribution::new(
            ContributionId::new("chat_panel")?,
            SlotId::new("app.main")?,
            "ChatPanel",
            0,
            None,
            Vec::new(),
            json!({}),
        )?],
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn descriptor_matches_the_manifest_contract() {
        let descriptor = build_descriptor().expect("descriptor builds");
        descriptor.validate().expect("descriptor is valid");

        assert_eq!(descriptor.id.as_str(), "amibot_chat");
        assert_eq!(descriptor.name, "Chat");
        assert_eq!(descriptor.core.to_string(), "^0.1");
        assert_eq!(descriptor.capabilities.len(), 1);
        assert_eq!(descriptor.permissions.len(), 2);
        assert_eq!(descriptor.ui.len(), 1);
        assert_eq!(descriptor.ui[0].component, "ChatPanel");
        assert_eq!(descriptor.ui[0].slot.as_str(), "app.main");
        assert_eq!(descriptor.ui[0].id.as_str(), "chat_panel");
        assert!(descriptor.ui[0].platforms.is_none());
    }
}
