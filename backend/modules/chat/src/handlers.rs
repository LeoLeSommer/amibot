use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::Arc;

use amibot_http::ApiError;
use axum::Json;
use axum::body::Bytes;
use axum::extract::Extension;
use axum::http::header;
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::settings::{ChatSettings, ModelSetting};
use crate::{ChatState, provider, stream};

const MAX_MESSAGES: usize = 100;
const MAX_MESSAGE_CHARS: usize = 32_000;
const MAX_SESSION_ID_CHARS: usize = 200;

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub session_id: Option<String>,
}

#[derive(Serialize)]
pub struct ModelsResponse {
    pub models: Vec<ModelSetting>,
    pub default_model: String,
}

/// Exposes the configured models. The API key is never part of the response.
pub async fn models(Extension(state): Extension<Arc<ChatState>>) -> Response {
    let body = ModelsResponse {
        models: state.settings.models.clone(),
        default_model: state.settings.default_model.clone(),
    };
    ([(header::CACHE_CONTROL, "no-store")], Json(body)).into_response()
}

/// Validates the request, then relays the full transcript (with the server-side
/// preprompt) to the upstream provider as an AI SDK v6 UI message stream.
pub async fn chat(
    Extension(state): Extension<Arc<ChatState>>,
    body: Bytes,
) -> Result<Response, ApiError> {
    let request: ChatRequest =
        serde_json::from_slice(&body).map_err(|_| ApiError::BadRequest("invalid request body"))?;
    validate(&request, &state.settings)?;

    if state.settings.api_key.trim().is_empty() {
        return Err(ApiError::ChatNotConfigured);
    }

    let model = request
        .model
        .as_deref()
        .unwrap_or(&state.settings.default_model);
    let session_id = session_id(&request, model)?;
    let payload = upstream_payload(&state.settings, &request.messages, model);

    let deltas = provider::open_delta_stream(&state.client, &state.settings, &payload, &session_id)
        .await
        .map_err(|error| {
            tracing::warn!(?error, "chat upstream request failed");
            ApiError::ChatUpstreamFailed
        })?;

    Ok(stream::ui_message_stream_response(deltas))
}

/// OpenCode Go requires a stable session per conversation. Prefer the client's
/// value; otherwise derive one from the conversation's first message so every
/// turn of the same transcript routes to the same session.
fn session_id(request: &ChatRequest, model: &str) -> Result<String, ApiError> {
    if let Some(value) = request.session_id.as_deref() {
        let value = value.trim();
        if !value.is_empty() {
            if value.chars().count() > MAX_SESSION_ID_CHARS
                || !value.bytes().all(|byte| byte.is_ascii_graphic())
            {
                return Err(ApiError::BadRequest("invalid session id"));
            }
            return Ok(value.to_string());
        }
    }

    let mut hasher = DefaultHasher::new();
    model.hash(&mut hasher);
    if let Some(first) = request.messages.first() {
        first.role.hash(&mut hasher);
        first.content.hash(&mut hasher);
    }
    Ok(format!("ses_{:016x}", hasher.finish()))
}

fn validate(request: &ChatRequest, settings: &ChatSettings) -> Result<(), ApiError> {
    if request.messages.len() > MAX_MESSAGES {
        return Err(ApiError::BadRequest("too many messages"));
    }
    let last = request
        .messages
        .last()
        .ok_or(ApiError::BadRequest("messages must not be empty"))?;
    if last.role != "user" {
        return Err(ApiError::BadRequest("last message must be from the user"));
    }
    for message in &request.messages {
        if message.role != "user" && message.role != "assistant" {
            return Err(ApiError::BadRequest("invalid message role"));
        }
        if message.content.chars().count() > MAX_MESSAGE_CHARS {
            return Err(ApiError::BadRequest("message content is too long"));
        }
    }
    if let Some(model) = &request.model
        && !settings.is_model_known(model)
    {
        return Err(ApiError::BadRequest("unknown model"));
    }
    Ok(())
}

fn upstream_payload(
    settings: &ChatSettings,
    messages: &[ChatMessage],
    model: &str,
) -> serde_json::Value {
    let mut upstream = Vec::with_capacity(messages.len() + 1);
    upstream.push(json!({ "role": "system", "content": settings.preprompt }));
    for message in messages {
        upstream.push(json!({ "role": message.role, "content": message.content }));
    }
    json!({
        "model": model,
        "stream": true,
        "messages": upstream,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn settings() -> ChatSettings {
        ChatSettings {
            enabled: true,
            provider: "opencode-go".to_string(),
            base_url: "https://example.invalid/v1/chat/completions".to_string(),
            api_key: "test-key".to_string(),
            models: vec![ModelSetting {
                id: "glm-flash".to_string(),
                label: "GLM Flash".to_string(),
            }],
            default_model: "glm-flash".to_string(),
            preprompt: "Be helpful.".to_string(),
        }
    }

    fn request(messages: Vec<(&str, &str)>, model: Option<&str>) -> ChatRequest {
        ChatRequest {
            messages: messages
                .into_iter()
                .map(|(role, content)| ChatMessage {
                    role: role.to_string(),
                    content: content.to_string(),
                })
                .collect(),
            model: model.map(str::to_string),
            session_id: None,
        }
    }

    #[test]
    fn accepts_a_valid_transcript() {
        let value = request(vec![("user", "hello")], None);
        assert!(validate(&value, &settings()).is_ok());
    }

    #[test]
    fn rejects_an_empty_transcript() {
        let value = request(vec![], None);
        assert!(matches!(
            validate(&value, &settings()),
            Err(ApiError::BadRequest(_))
        ));
    }

    #[test]
    fn requires_the_last_message_to_be_from_the_user() {
        let value = request(vec![("assistant", "hi"), ("user", "hello")], None);
        assert!(validate(&value, &settings()).is_ok());

        let value = request(vec![("user", "hello"), ("assistant", "hi")], None);
        assert!(matches!(
            validate(&value, &settings()),
            Err(ApiError::BadRequest(_))
        ));
    }

    #[test]
    fn rejects_invalid_roles_and_unknown_models() {
        let value = request(vec![("system", "x"), ("user", "hello")], None);
        assert!(matches!(
            validate(&value, &settings()),
            Err(ApiError::BadRequest(_))
        ));

        let value = request(vec![("user", "hello")], Some("unknown"));
        assert!(matches!(
            validate(&value, &settings()),
            Err(ApiError::BadRequest(_))
        ));
    }

    #[test]
    fn rejects_oversized_content() {
        let long = "x".repeat(MAX_MESSAGE_CHARS + 1);
        let value = request(vec![("user", &long)], None);
        assert!(matches!(
            validate(&value, &settings()),
            Err(ApiError::BadRequest(_))
        ));
    }

    #[test]
    fn upstream_payload_prepends_the_preprompt_and_enables_streaming() {
        let value = request(vec![("user", "hello")], Some("glm-flash"));
        let payload = upstream_payload(&settings(), &value.messages, "glm-flash");

        assert_eq!(payload["model"], "glm-flash");
        assert_eq!(payload["stream"], true);
        assert_eq!(payload["messages"][0]["role"], "system");
        assert_eq!(payload["messages"][0]["content"], "Be helpful.");
        assert_eq!(payload["messages"][1]["role"], "user");
        assert_eq!(payload["messages"][1]["content"], "hello");
    }

    #[test]
    fn malformed_json_is_rejected_as_a_bad_request() {
        let parsed = serde_json::from_slice::<ChatRequest>(b"not json");
        assert!(parsed.is_err());
    }

    #[test]
    fn keeps_a_valid_client_session_id() {
        let mut value = request(vec![("user", "hello")], None);
        value.session_id = Some("ses_client_123".to_string());
        assert_eq!(session_id(&value, "glm-flash").unwrap(), "ses_client_123");
    }

    #[test]
    fn rejects_an_invalid_client_session_id() {
        let mut value = request(vec![("user", "hello")], None);
        value.session_id = Some("bad\nheader".to_string());
        assert!(matches!(
            session_id(&value, "glm-flash"),
            Err(ApiError::BadRequest(_))
        ));
    }

    #[test]
    fn derives_a_stable_session_id_from_the_first_message() {
        let value = request(
            vec![("user", "hello"), ("assistant", "hi"), ("user", "again")],
            None,
        );
        let first = session_id(&value, "glm-flash").expect("session id");
        let second = session_id(&value, "glm-flash").expect("session id");
        assert_eq!(first, second);
        assert!(first.starts_with("ses_"));

        let mut other = request(vec![("user", "different")], None);
        other.session_id = None;
        assert_ne!(first, session_id(&other, "glm-flash").unwrap());
    }
}
