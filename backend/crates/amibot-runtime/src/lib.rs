use std::sync::Arc;

use amibot_core::{Module, ModuleRegistry};
use axum::Router;
use sea_orm::DatabaseConnection;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub registry: Arc<ModuleRegistry>,
    pub server_name: Arc<str>,
}

/// An official module that can contribute HTTP routes. The Core never depends
/// on Axum; this trait lives in the runtime crate so future modules can expose
/// routes while the resolver stays transport-agnostic.
pub trait RuntimeModule: Module {
    fn api_router(&self) -> Router<AppState>;
}
