# Backend

Rust server for Amibot: Axum 0.8, SeaORM 2, PostgreSQL 17. The root package is
the `amibot-server` binary; foundation crates live in `crates/`; future
official modules live in `modules/`.

## Workspace

```text
backend/
├── Cargo.toml            workspace + amibot-server binary
├── src/
│   ├── main.rs
│   └── app/              config, startup, router, api, health, registry, web
├── crates/
│   ├── amibot-core/       IDs, descriptors, registry, resolution, manifest
│   ├── amibot-http/       ApiError, client-version middleware
│   ├── amibot-schema/     SeaORM entities (core tables only)
│   ├── amibot-migrations/ SeaORM migrator
│   ├── amibot-storage/    database connection, health, activation reads
│   └── amibot-runtime/    AppState, RuntimeModule trait
├── modules/              future official modules
└── tests/architecture.rs dependency guard
```

Dependency direction (enforced):

```text
core | schema | migrations
        └── storage ──┐
http ── core          ├── runtime ── core
                      └── amibot-server (binary)
```

`amibot-core` never depends on Axum or SeaORM. `amibot-runtime` depends only on
`amibot-core` internally; Axum and SeaORM are direct external dependencies.

## Run

```bash
cp .env.example .env
docker compose up -d db
cargo run
```

The server applies migrations at startup, then serves the API and the web build
from `AMIBOT_WEB_DIR` (default `../frontend/dist`).

Configuration is read from the environment:

- `DATABASE_URL` (required)
- `AMIBOT_BIND_ADDR` (default `0.0.0.0:3000`)
- `AMIBOT_SERVER_NAME` (default `Amibot`)
- `AMIBOT_ALLOWED_ORIGINS` (comma-separated, empty by default, `*` rejected)
- `AMIBOT_WEB_DIR` (default `../frontend/dist`)
- `RUST_LOG` (default `info`)

Never log `DATABASE_URL`.

## API contract

- `GET /health` — `{ "status": "ok", "database": "ok" }` or `503` degraded.
- `GET /api/v1/app/manifest` — current manifest, rebuilt per request with one
  activation read. `Cache-Control: no-store`.
- `GET /api/v1/client-compatibility` — `{ "min_client_api_version": 1 }`,
  exempt from the client-version gate.
- `GET /` and unknown non-API paths — embedded Expo Web build, SPA fallback.
- Unknown `/api` paths — `404` JSON.

JSON errors are `{ "error": ..., "code": ... }`; `404` omits the code.

Every `/api/v1` route except `client-compatibility` accepts an optional
`X-Client-Api-Version` header. Missing and `>= 1` are accepted, `< 1` returns
`426` with `client_update_required`, and non-numeric values return `400`.

## Modules

A module is a crate in `modules/<short>/` named `amibot-<short>`, implementing
`amibot_core::Module` and `amibot_runtime::RuntimeModule`. It declares a
descriptor (ID, version, core requirement, dependencies, capabilities,
permissions, UI contributions), exposes routes relative to `/api/v1`, and owns
its schema and migrations.

Modules are registered in `src/app/registry.rs`; the resolver rejects duplicate
module/capability/contribution IDs, missing or disabled required dependencies,
self-dependencies, cycles, and incompatible core requirements. Activation is
read from `module_activation`: a missing row means enabled,
`enabled = false` disables. Activation currently filters the manifest only;
module routers are mounted at startup.

## Migrations

- Never edit an applied migration; add a new one.
- Core tables belong to `amibot-schema`; module tables belong to the module.
- The migrator runs at server startup.

## Tests

- `cargo test --workspace` — pure unit tests, inline `#[cfg(test)]` modules.
- `cargo test --test architecture` — dependency guard.
- `cargo clippy --workspace --all-targets -- -D warnings`.
- HTTP contracts live in `tests/api/hurl/`, not here.

Unit tests must stay fast, deterministic, and free of Docker, network, and
environment dependencies.
