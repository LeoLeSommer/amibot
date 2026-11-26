use std::sync::Arc;

use amibot_core::{CORE_VERSION, Module, ModuleRegistry};
use amibot_migrations::migration::Migrator;
use amibot_runtime::AppState;
use anyhow::{Context, Result};
use axum::http::{HeaderValue, header};
use sea_orm_migration::MigratorTrait;
use tokio::signal;
use tower_http::cors::{AllowHeaders, AllowMethods, AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::app::{Config, registry, router};

pub async fn run() -> Result<()> {
    init_tracing();

    let config = Arc::new(Config::from_env()?);

    let db = amibot_storage::connect(&config.database_url)
        .await
        .context("failed to connect to the database")?;
    Migrator::up(&db, None)
        .await
        .context("failed to run database migrations")?;

    let modules = registry::modules(&config.settings)?;
    let mut module_registry = ModuleRegistry::new();
    for module in &modules {
        let module: Arc<dyn Module> = module.clone();
        module_registry
            .register(module)
            .context("failed to register a compiled module")?;
    }
    tracing::info!(
        core_version = CORE_VERSION,
        modules = module_registry.len(),
        "module registry initialized"
    );

    let state = AppState {
        db,
        registry: Arc::new(module_registry),
        server_name: Arc::from(config.server_name.as_str()),
    };

    let mut app = router::build(state, &modules, &config.web_dir).layer(TraceLayer::new_for_http());
    if !config.allowed_origins.is_empty() {
        app = app.layer(build_cors(&config));
    }

    let listener = tokio::net::TcpListener::bind(config.bind_addr)
        .await
        .with_context(|| format!("failed to bind {}", config.bind_addr))?;
    tracing::info!(addr = %listener.local_addr()?, "amibot server listening");

    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("server error")?;

    Ok(())
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into());
    tracing_subscriber::fmt().with_env_filter(filter).init();
}

fn build_cors(config: &Config) -> CorsLayer {
    let origins = config
        .allowed_origins
        .iter()
        .filter_map(|origin| origin.parse::<HeaderValue>().ok())
        .collect::<Vec<_>>();

    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods(AllowMethods::mirror_request())
        .allow_headers(AllowHeaders::mirror_request())
        .allow_credentials(true)
        .expose_headers([header::CACHE_CONTROL])
}

async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(error) = signal::ctrl_c().await {
            tracing::error!(%error, "failed to listen for Ctrl+C");
            std::future::pending::<()>().await;
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match signal::unix::signal(signal::unix::SignalKind::terminate()) {
            Ok(mut stream) => {
                stream.recv().await;
            }
            Err(error) => {
                tracing::error!(%error, "failed to listen for SIGTERM");
                std::future::pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }

    tracing::info!("shutdown signal received");
}
