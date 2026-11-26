use crate::settings::ChatSettings;
use crate::{Delta, DeltaStream, ProviderError};
use futures_util::StreamExt;
use reqwest::Client;
use serde_json::Value;

const SESSION_HEADER: &str = "x-opencode-session";

/// Extracts the content deltas from one upstream `data:` frame. Reasoning is
/// read from `choices[0].delta.reasoning_content` with `reasoning` as the
/// fallback field name, then answer text from `choices[0].delta.content`. Empty
/// and non-string values are skipped. A frame carrying an `error` object is a
/// typed upstream failure.
fn deltas_from_value(value: &Value) -> Result<Vec<Delta>, ProviderError> {
    if value.get("error").is_some() {
        return Err(ProviderError::Upstream);
    }

    let mut deltas = Vec::new();
    let Some(delta) = value.pointer("/choices/0/delta") else {
        return Ok(deltas);
    };

    let reasoning = delta
        .get("reasoning_content")
        .and_then(Value::as_str)
        .or_else(|| delta.get("reasoning").and_then(Value::as_str));
    if let Some(reasoning) = reasoning.filter(|text| !text.is_empty()) {
        deltas.push(Delta::Reasoning(reasoning.to_string()));
    }

    if let Some(content) = delta
        .get("content")
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty())
    {
        deltas.push(Delta::Text(content.to_string()));
    }

    Ok(deltas)
}

/// Opens the upstream OpenAI-compatible stream and yields reasoning and text
/// deltas. SSE lines are buffered across chunk boundaries; `[DONE]` ends the
/// stream. Upstream error bodies are never surfaced: a failure is reported as
/// a typed error kind only. OpenCode Go requires a stable
/// `x-opencode-session` per conversation and a client user agent.
pub async fn open_delta_stream(
    client: &Client,
    settings: &ChatSettings,
    payload: &Value,
    session_id: &str,
) -> Result<DeltaStream, ProviderError> {
    let response = client
        .post(&settings.base_url)
        .bearer_auth(&settings.api_key)
        .header(SESSION_HEADER, session_id)
        .header(
            reqwest::header::USER_AGENT,
            concat!("amibot/", env!("CARGO_PKG_VERSION")),
        )
        .json(payload)
        .send()
        .await
        .map_err(|error| {
            let kind = if error.is_timeout() {
                "timeout"
            } else if error.is_connect() {
                "connect"
            } else {
                "request"
            };
            tracing::warn!(kind, "chat upstream request failed");
            ProviderError::Request
        })?;

    let status = response.status();
    if !status.is_success() {
        tracing::warn!(
            status = status.as_u16(),
            "chat upstream returned an error status"
        );
        return Err(ProviderError::Status(status.as_u16()));
    }

    let mut bytes = Box::pin(response.bytes_stream());
    let stream = async_stream::stream! {
        let mut buffer: Vec<u8> = Vec::new();
        let mut done = false;

        while !done {
            match bytes.next().await {
                Some(Ok(chunk)) => {
                    buffer.extend_from_slice(&chunk);
                    while let Some(position) = buffer.iter().position(|byte| *byte == b'\n') {
                        let line: Vec<u8> = buffer.drain(..=position).collect();
                        let line = String::from_utf8_lossy(&line);
                        let line = line.trim();
                        let Some(data) = line.strip_prefix("data:") else {
                            continue;
                        };
                        let data = data.trim();
                        if data == "[DONE]" {
                            done = true;
                            break;
                        }
                        if let Ok(value) = serde_json::from_str::<Value>(data) {
                            match deltas_from_value(&value) {
                                Ok(deltas) => {
                                    for delta in deltas {
                                        yield Ok(delta);
                                    }
                                }
                                Err(error) => {
                                    yield Err(error);
                                    done = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                Some(Err(_)) => {
                    yield Err(ProviderError::Stream);
                    done = true;
                }
                None => done = true,
            }
        }
    };

    Ok(Box::pin(stream))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn extracts_reasoning_only() {
        let value = json!({ "choices": [{ "delta": { "reasoning_content": "think" } }] });
        assert_eq!(
            deltas_from_value(&value),
            Ok(vec![Delta::Reasoning("think".to_string())])
        );
    }

    #[test]
    fn extracts_text_only() {
        let value = json!({ "choices": [{ "delta": { "content": "hello" } }] });
        assert_eq!(
            deltas_from_value(&value),
            Ok(vec![Delta::Text("hello".to_string())])
        );
    }

    #[test]
    fn extracts_both_fields_in_reasoning_first_order() {
        let value = json!({
            "choices": [{ "delta": { "reasoning_content": "think", "content": "hello" } }]
        });
        assert_eq!(
            deltas_from_value(&value),
            Ok(vec![
                Delta::Reasoning("think".to_string()),
                Delta::Text("hello".to_string()),
            ])
        );
    }

    #[test]
    fn falls_back_to_the_reasoning_field() {
        let value = json!({ "choices": [{ "delta": { "reasoning": "think" } }] });
        assert_eq!(
            deltas_from_value(&value),
            Ok(vec![Delta::Reasoning("think".to_string())])
        );
    }

    #[test]
    fn skips_null_and_empty_values() {
        let value = json!({
            "choices": [{
                "delta": {
                    "reasoning_content": null,
                    "reasoning": "",
                    "content": ""
                }
            }]
        });
        assert_eq!(deltas_from_value(&value), Ok(Vec::new()));
    }

    #[test]
    fn skips_frames_without_a_delta() {
        let value = json!({ "choices": [{ "delta": {} }] });
        assert_eq!(deltas_from_value(&value), Ok(Vec::new()));
    }

    #[test]
    fn reports_error_frames_as_upstream_failures() {
        let value = json!({ "error": { "message": "nope" } });
        assert!(matches!(
            deltas_from_value(&value),
            Err(ProviderError::Upstream)
        ));
    }
}
