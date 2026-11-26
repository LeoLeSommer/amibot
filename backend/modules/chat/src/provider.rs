use crate::settings::ChatSettings;
use crate::{DeltaStream, ProviderError};
use futures_util::StreamExt;
use reqwest::Client;
use serde_json::Value;

const SESSION_HEADER: &str = "x-opencode-session";

/// Opens the upstream OpenAI-compatible stream and yields the text deltas from
/// `choices[0].delta.content`. SSE lines are buffered across chunk boundaries;
/// `[DONE]` ends the stream. Upstream error bodies are never surfaced: a
/// failure is reported as a typed error kind only. OpenCode Go requires a
/// stable `x-opencode-session` per conversation and a client user agent.
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
                            if value.get("error").is_some() {
                                yield Err(ProviderError::Upstream);
                                done = true;
                                break;
                            }
                            if let Some(content) = value
                                .pointer("/choices/0/delta/content")
                                .and_then(|part| part.as_str())
                                && !content.is_empty()
                            {
                                yield Ok(content.to_string());
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
