use std::path::Path;

use axum::Router;
use axum::http::{HeaderValue, header};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::set_header::SetResponseHeaderLayer;

/// Serves the embedded Expo Web build. Unknown non-API paths fall back to
/// `index.html` with a `200` so client-side routes work; a missing build
/// directory keeps the API usable and makes web routes return 404.
pub fn service(web_dir: &Path) -> Router {
    let index = web_dir.join("index.html");
    let files = ServeDir::new(web_dir).fallback(ServeFile::new(index));

    Router::new()
        .fallback_service(files)
        .layer(SetResponseHeaderLayer::overriding(
            header::CACHE_CONTROL,
            HeaderValue::from_static("no-cache"),
        ))
}
