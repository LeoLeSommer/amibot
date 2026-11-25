use std::sync::Arc;

use amibot_core::manifest::ManifestBuilder;
use amibot_core::{ActivationState, CORE_VERSION, MIN_CLIENT_API_VERSION};
use amibot_http::{ApiError, enforce_client_version};
use amibot_runtime::{AppState, RuntimeModule};
use axum::extract::State;
use axum::http::header;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use semver::Version;
use serde::Serialize;

pub fn router(modules: &[Arc<dyn RuntimeModule>]) -> Router<AppState> {
    Router::new()
        .nest("/v1", v1_router(modules))
        .fallback(api_not_found)
}

fn v1_router(modules: &[Arc<dyn RuntimeModule>]) -> Router<AppState> {
    let mut protected = Router::new().route("/app/manifest", get(manifest));
    for module in modules {
        protected = protected.merge(module.api_router());
    }
    let protected = protected.layer(middleware::from_fn(enforce_client_version));

    Router::new()
        .route("/client-compatibility", get(compatibility))
        .merge(protected)
        .fallback(api_not_found)
}

#[derive(Debug, Serialize)]
pub struct ClientCompatibilityDto {
    pub min_client_api_version: u32,
}

pub async fn compatibility() -> Json<ClientCompatibilityDto> {
    Json(ClientCompatibilityDto {
        min_client_api_version: MIN_CLIENT_API_VERSION,
    })
}

pub async fn manifest(State(state): State<AppState>) -> Result<Response, ApiError> {
    let entries = amibot_storage::load_module_activations(&state.db)
        .await
        .map_err(|error| {
            tracing::error!(%error, "failed to load module activations");
            ApiError::DatabaseUnavailable
        })?;

    let (activation, unknown) = ActivationState::from_entries(entries, &state.registry.ids());
    for module_id in unknown {
        tracing::warn!(%module_id, "ignoring unknown module activation row");
    }

    let core_version = Version::parse(CORE_VERSION).map_err(|error| {
        tracing::error!(%error, "invalid core version");
        ApiError::Internal
    })?;

    let modules = state
        .registry
        .resolve(&core_version, &activation)
        .map_err(|error| {
            tracing::error!(%error, "module resolution failed");
            ApiError::ModuleResolutionFailed
        })?;

    let manifest = ManifestBuilder::new(core_version, state.server_name.as_ref())
        .with_modules(modules)
        .build()
        .map_err(|error| {
            tracing::error!(%error, "manifest build failed");
            ApiError::ModuleResolutionFailed
        })?;

    Ok(([(header::CACHE_CONTROL, "no-store")], Json(manifest)).into_response())
}

async fn api_not_found() -> ApiError {
    ApiError::NotFound
}
