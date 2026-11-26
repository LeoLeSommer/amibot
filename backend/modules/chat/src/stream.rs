use axum::body::{Body, Bytes};
use axum::http::{HeaderMap, HeaderName, HeaderValue, header};
use axum::response::{IntoResponse, Response};
use futures_util::StreamExt;
use serde_json::{Value, json};

use crate::{Delta, DeltaStream};

/// Serializes one AI SDK v6 UI message stream part as an SSE `data:` frame.
fn sse(value: Value) -> Bytes {
    let text = serde_json::to_string(&value).unwrap_or_else(|_| "{}".to_string());
    Bytes::from(format!("data: {text}\n\n"))
}

/// Builds the ordered AI SDK v6 UI message stream chunks. The client parser
/// rejects a delta whose part was never started, so every `*-delta` is emitted
/// after its matching `*-start`. Reasoning and text parts use independent ids
/// that start at `"0"`; a part that resumes after the other kind is closed
/// first and reopened with a new id so no content is dropped.
#[derive(Default)]
struct UiParts {
    started: bool,
    reasoning_id: Option<String>,
    text_id: Option<String>,
    next_reasoning_id: u32,
    next_text_id: u32,
}

impl UiParts {
    fn ensure_started(&mut self, chunks: &mut Vec<Value>) {
        if !self.started {
            chunks.push(json!({ "type": "start" }));
            self.started = true;
        }
    }

    fn close_reasoning(&mut self, chunks: &mut Vec<Value>) {
        if let Some(id) = self.reasoning_id.take() {
            chunks.push(json!({ "type": "reasoning-end", "id": id }));
        }
    }

    fn close_text(&mut self, chunks: &mut Vec<Value>) {
        if let Some(id) = self.text_id.take() {
            chunks.push(json!({ "type": "text-end", "id": id }));
        }
    }

    fn on_delta(&mut self, delta: Delta) -> Vec<Value> {
        let mut chunks = Vec::new();
        self.ensure_started(&mut chunks);

        match delta {
            Delta::Reasoning(text) => {
                if text.is_empty() {
                    return chunks;
                }
                self.close_text(&mut chunks);
                if self.reasoning_id.is_none() {
                    let id = self.next_reasoning_id.to_string();
                    self.next_reasoning_id += 1;
                    chunks.push(json!({ "type": "reasoning-start", "id": id }));
                    self.reasoning_id = Some(id);
                }
                if let Some(id) = &self.reasoning_id {
                    chunks.push(json!({ "type": "reasoning-delta", "id": id, "delta": text }));
                }
            }
            Delta::Text(text) => {
                if text.is_empty() {
                    return chunks;
                }
                self.close_reasoning(&mut chunks);
                if self.text_id.is_none() {
                    let id = self.next_text_id.to_string();
                    self.next_text_id += 1;
                    chunks.push(json!({ "type": "text-start", "id": id }));
                    self.text_id = Some(id);
                }
                if let Some(id) = &self.text_id {
                    chunks.push(json!({ "type": "text-delta", "id": id, "delta": text }));
                }
            }
        }

        chunks
    }

    /// Closes any open part and emits a typed error before finishing.
    fn on_error(&mut self) -> Vec<Value> {
        let mut chunks = Vec::new();
        self.ensure_started(&mut chunks);
        self.close_reasoning(&mut chunks);
        self.close_text(&mut chunks);
        chunks.push(json!({ "type": "error", "errorText": "chat upstream failed" }));
        chunks.push(json!({ "type": "finish" }));
        chunks
    }

    /// Closes any open part and finishes the message.
    fn finish(&mut self) -> Vec<Value> {
        let mut chunks = Vec::new();
        self.ensure_started(&mut chunks);
        self.close_reasoning(&mut chunks);
        self.close_text(&mut chunks);
        chunks.push(json!({ "type": "finish" }));
        chunks
    }
}

/// Maps upstream deltas into the AI SDK v6 UI message stream. The event names
/// and the `x-vercel-ai-ui-message-stream: v1` header are the contract consumed
/// by `DefaultChatTransport`. A mid-stream upstream failure becomes an `error`
/// part rather than leaking the upstream error body.
pub fn ui_message_stream_response(mut deltas: DeltaStream) -> Response {
    let stream = async_stream::stream! {
        let mut parts = UiParts::default();

        while let Some(item) = deltas.next().await {
            match item {
                Ok(delta) => {
                    for chunk in parts.on_delta(delta) {
                        yield Ok::<Bytes, std::io::Error>(sse(chunk));
                    }
                }
                Err(error) => {
                    tracing::warn!(?error, "chat upstream stream failed mid-response");
                    for chunk in parts.on_error() {
                        yield Ok(sse(chunk));
                    }
                    yield Ok(Bytes::from_static(b"data: [DONE]\n\n"));
                    return;
                }
            }
        }

        for chunk in parts.finish() {
            yield Ok(sse(chunk));
        }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn emits_reasoning_then_text_in_order() {
        let mut parts = UiParts::default();
        let mut chunks = Vec::new();
        chunks.extend(parts.on_delta(Delta::Reasoning("think".to_string())));
        chunks.extend(parts.on_delta(Delta::Text("answer".to_string())));
        chunks.extend(parts.finish());

        assert_eq!(
            chunks,
            vec![
                json!({ "type": "start" }),
                json!({ "type": "reasoning-start", "id": "0" }),
                json!({ "type": "reasoning-delta", "id": "0", "delta": "think" }),
                json!({ "type": "reasoning-end", "id": "0" }),
                json!({ "type": "text-start", "id": "0" }),
                json!({ "type": "text-delta", "id": "0", "delta": "answer" }),
                json!({ "type": "text-end", "id": "0" }),
                json!({ "type": "finish" }),
            ]
        );
    }

    #[test]
    fn emits_text_only_like_the_previous_contract() {
        let mut parts = UiParts::default();
        let mut chunks = Vec::new();
        chunks.extend(parts.on_delta(Delta::Text("hello".to_string())));
        chunks.extend(parts.finish());

        assert_eq!(
            chunks,
            vec![
                json!({ "type": "start" }),
                json!({ "type": "text-start", "id": "0" }),
                json!({ "type": "text-delta", "id": "0", "delta": "hello" }),
                json!({ "type": "text-end", "id": "0" }),
                json!({ "type": "finish" }),
            ]
        );
    }

    #[test]
    fn emits_reasoning_only_without_an_empty_text_part() {
        let mut parts = UiParts::default();
        let mut chunks = Vec::new();
        chunks.extend(parts.on_delta(Delta::Reasoning("think".to_string())));
        chunks.extend(parts.finish());

        assert_eq!(
            chunks,
            vec![
                json!({ "type": "start" }),
                json!({ "type": "reasoning-start", "id": "0" }),
                json!({ "type": "reasoning-delta", "id": "0", "delta": "think" }),
                json!({ "type": "reasoning-end", "id": "0" }),
                json!({ "type": "finish" }),
            ]
        );
    }

    #[test]
    fn reopens_reasoning_with_a_new_id_after_text() {
        let mut parts = UiParts::default();
        let mut chunks = Vec::new();
        chunks.extend(parts.on_delta(Delta::Reasoning("first".to_string())));
        chunks.extend(parts.on_delta(Delta::Text("answer".to_string())));
        chunks.extend(parts.on_delta(Delta::Reasoning("second".to_string())));
        chunks.extend(parts.on_delta(Delta::Text("more".to_string())));
        chunks.extend(parts.finish());

        assert_eq!(
            chunks,
            vec![
                json!({ "type": "start" }),
                json!({ "type": "reasoning-start", "id": "0" }),
                json!({ "type": "reasoning-delta", "id": "0", "delta": "first" }),
                json!({ "type": "reasoning-end", "id": "0" }),
                json!({ "type": "text-start", "id": "0" }),
                json!({ "type": "text-delta", "id": "0", "delta": "answer" }),
                json!({ "type": "text-end", "id": "0" }),
                json!({ "type": "reasoning-start", "id": "1" }),
                json!({ "type": "reasoning-delta", "id": "1", "delta": "second" }),
                json!({ "type": "reasoning-end", "id": "1" }),
                json!({ "type": "text-start", "id": "1" }),
                json!({ "type": "text-delta", "id": "1", "delta": "more" }),
                json!({ "type": "text-end", "id": "1" }),
                json!({ "type": "finish" }),
            ]
        );
    }

    #[test]
    fn closes_reasoning_before_an_error() {
        let mut parts = UiParts::default();
        let mut chunks = Vec::new();
        chunks.extend(parts.on_delta(Delta::Reasoning("think".to_string())));
        chunks.extend(parts.on_error());

        assert_eq!(
            chunks,
            vec![
                json!({ "type": "start" }),
                json!({ "type": "reasoning-start", "id": "0" }),
                json!({ "type": "reasoning-delta", "id": "0", "delta": "think" }),
                json!({ "type": "reasoning-end", "id": "0" }),
                json!({ "type": "error", "errorText": "chat upstream failed" }),
                json!({ "type": "finish" }),
            ]
        );
    }

    #[test]
    fn skips_empty_deltas_without_opening_a_part() {
        let mut parts = UiParts::default();
        let mut chunks = Vec::new();
        chunks.extend(parts.on_delta(Delta::Reasoning(String::new())));
        chunks.extend(parts.on_delta(Delta::Text(String::new())));
        chunks.extend(parts.finish());

        assert_eq!(
            chunks,
            vec![json!({ "type": "start" }), json!({ "type": "finish" })]
        );
    }
}
