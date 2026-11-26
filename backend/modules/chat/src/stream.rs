use axum::body::{Body, Bytes};
use axum::http::{HeaderMap, HeaderName, HeaderValue, header};
use axum::response::{IntoResponse, Response};
use futures_util::StreamExt;
use serde_json::{Value, json};

use crate::DeltaStream;

/// Serializes one AI SDK v6 UI message stream part as an SSE `data:` frame.
fn sse(value: Value) -> Bytes {
    let text = serde_json::to_string(&value).unwrap_or_else(|_| "{}".to_string());
    Bytes::from(format!("data: {text}\n\n"))
}

/// Maps upstream text deltas into the AI SDK v6 UI message stream. The event
/// names and the `x-vercel-ai-ui-message-stream: v1` header are the contract
/// consumed by `DefaultChatTransport`. A mid-stream upstream failure becomes an
/// `error` part rather than leaking the upstream error body.
pub fn ui_message_stream_response(mut deltas: DeltaStream) -> Response {
    let stream = async_stream::stream! {
        yield Ok::<Bytes, std::io::Error>(sse(json!({ "type": "start" })));
        yield Ok(sse(json!({ "type": "text-start", "id": "0" })));

        let mut failed = false;
        while let Some(item) = deltas.next().await {
            match item {
                Ok(delta) => {
                    if !delta.is_empty() {
                        yield Ok(sse(
                            json!({ "type": "text-delta", "id": "0", "delta": delta }),
                        ));
                    }
                }
                Err(error) => {
                    tracing::warn!(?error, "chat upstream stream failed mid-response");
                    failed = true;
                    break;
                }
            }
        }

        yield Ok(sse(json!({ "type": "text-end", "id": "0" })));
        if failed {
            yield Ok(sse(json!({ "type": "error", "errorText": "chat upstream failed" })));
        }
        yield Ok(sse(json!({ "type": "finish" })));
        yield Ok(Bytes::from_static(b"data: [DONE]\n\n"));
    };

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/event-stream"),
    );
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    headers.insert(
        HeaderName::from_static("x-vercel-ai-ui-message-stream"),
        HeaderValue::from_static("v1"),
    );
    headers.insert(
        HeaderName::from_static("x-accel-buffering"),
        HeaderValue::from_static("no"),
    );

    (headers, Body::from_stream(stream)).into_response()
}
