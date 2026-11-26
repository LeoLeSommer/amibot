use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use amibot_core::MIN_CLIENT_API_VERSION;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ApiError {
    BadRequest(&'static str),
    NotFound,
    ClientUpdateRequired { min_client_api_version: u32 },
    DatabaseUnavailable,
    ModuleResolutionFailed,
    ChatNotConfigured,
    ChatUpstreamFailed,
    Internal,
}

impl ApiError {
    pub fn client_update_required() -> Self {
        Self::ClientUpdateRequired {
            min_client_api_version: MIN_CLIENT_API_VERSION,
        }
    }

    pub fn status(self) -> StatusCode {
        match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::ClientUpdateRequired { .. } => StatusCode::UPGRADE_REQUIRED,
            Self::DatabaseUnavailable | Self::ChatNotConfigured => StatusCode::SERVICE_UNAVAILABLE,
            Self::ChatUpstreamFailed => StatusCode::BAD_GATEWAY,
            Self::ModuleResolutionFailed | Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn body(self) -> serde_json::Value {
        match self {
            Self::BadRequest(error) => {
                serde_json::json!({ "error": error, "code": "bad_request" })
            }
            Self::NotFound => serde_json::json!({ "error": "not found" }),
            Self::ClientUpdateRequired {
                min_client_api_version,
            } => serde_json::json!({
                "error": "client update required",
                "code": "client_update_required",
                "min_client_api_version": min_client_api_version,
            }),
            Self::DatabaseUnavailable => serde_json::json!({
                "error": "database unavailable",
                "code": "database_unavailable",
            }),
            Self::ModuleResolutionFailed => serde_json::json!({
                "error": "module resolution failed",
                "code": "module_resolution_failed",
            }),
            Self::ChatNotConfigured => serde_json::json!({
                "error": "chat is not configured",
                "code": "chat_not_configured",
            }),
            Self::ChatUpstreamFailed => serde_json::json!({
                "error": "chat upstream failed",
                "code": "chat_upstream_failed",
            }),
            Self::Internal => {
                serde_json::json!({ "error": "internal error", "code": "internal" })
            }
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status(), Json(self.body())).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_status_codes() {
        assert_eq!(
            ApiError::BadRequest("invalid").status(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(ApiError::NotFound.status(), StatusCode::NOT_FOUND);
        assert_eq!(
            ApiError::client_update_required().status(),
            StatusCode::UPGRADE_REQUIRED
        );
        assert_eq!(
            ApiError::DatabaseUnavailable.status(),
            StatusCode::SERVICE_UNAVAILABLE
        );
        assert_eq!(
            ApiError::ModuleResolutionFailed.status(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
        assert_eq!(
            ApiError::Internal.status(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
        assert_eq!(
            ApiError::ChatNotConfigured.status(),
            StatusCode::SERVICE_UNAVAILABLE
        );
        assert_eq!(
            ApiError::ChatUpstreamFailed.status(),
            StatusCode::BAD_GATEWAY
        );
    }

    #[test]
    fn serializes_the_chat_error_contracts() {
        assert_eq!(
            ApiError::ChatNotConfigured.body(),
            serde_json::json!({
                "error": "chat is not configured",
                "code": "chat_not_configured",
            })
        );
        assert_eq!(
            ApiError::ChatUpstreamFailed.body(),
            serde_json::json!({
                "error": "chat upstream failed",
                "code": "chat_upstream_failed",
            })
        );
    }

    #[test]
    fn serializes_the_update_required_contract() {
        assert_eq!(
            ApiError::client_update_required().body(),
            serde_json::json!({
                "error": "client update required",
                "code": "client_update_required",
                "min_client_api_version": MIN_CLIENT_API_VERSION,
            })
        );
    }

    #[test]
    fn not_found_has_no_code() {
        assert_eq!(
            ApiError::NotFound.body(),
            serde_json::json!({ "error": "not found" })
        );
    }
}
