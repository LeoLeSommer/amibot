use std::sync::Arc;

use amibot_runtime::{AppState, RuntimeModule};
use axum::Router;
use axum::routing::get;

use crate::app::{api, health, web};

pub fn build(
    state: AppState,
    modules: &[Arc<dyn RuntimeModule>],
    web_dir: &std::path::Path,
) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .nest("/api", api::router(modules))
        .fallback_service(web::service(web_dir))
        .with_state(state)
}
