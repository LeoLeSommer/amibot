use axum::extract::Request;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use amibot_core::client_version::{
    CLIENT_API_VERSION_HEADER, ClientVersion, ClientVersionError, is_update_required,
    parse_client_version,
};

use crate::error::ApiError;

/// Rejects malformed client version headers with `400` and outdated clients
/// with `426`. Requests without the header stay compatible. Routers mount this
/// middleware only on the routes that must enforce the contract.
pub async fn enforce_client_version(request: Request, next: Next) -> Response {
    let version = request
        .headers()
        .get(CLIENT_API_VERSION_HEADER)
        .map(|value| value.to_str().map_err(|_| ClientVersionError))
        .transpose()
        .and_then(|value| parse_client_version(value));

    match version {
        Ok(ClientVersion::Missing) => next.run(request).await,
        Ok(ClientVersion::Valid(version)) if is_update_required(version) => {
            ApiError::client_update_required().into_response()
        }
        Ok(ClientVersion::Valid(_)) => next.run(request).await,
        Err(ClientVersionError) => {
            ApiError::BadRequest("invalid client api version").into_response()
        }
    }
}
