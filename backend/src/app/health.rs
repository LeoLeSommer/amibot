use amibot_runtime::AppState;
use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HealthDto {
    pub status: &'static str,
    pub database: &'static str,
}

pub async fn health(State(state): State<AppState>) -> (StatusCode, Json<HealthDto>) {
    match amibot_storage::ping(&state.db).await {
        Ok(()) => health_response(true),
        Err(error) => {
            tracing::warn!(%error, "database health check failed");
            health_response(false)
        }
    }
}

fn health_response(database_ok: bool) -> (StatusCode, Json<HealthDto>) {
    if database_ok {
        (
            StatusCode::OK,
            Json(HealthDto {
                status: "ok",
                database: "ok",
            }),
        )
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(HealthDto {
                status: "degraded",
                database: "error",
            }),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_ok_when_the_database_answers() {
        let (status, Json(body)) = health_response(true);

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body.status, "ok");
        assert_eq!(body.database, "ok");
    }

    #[test]
    fn reports_degraded_when_the_database_fails() {
        let (status, Json(body)) = health_response(false);

        assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(body.status, "degraded");
        assert_eq!(body.database, "error");
    }
}
