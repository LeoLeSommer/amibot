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
├── settings.yaml         root settings (committed, no secrets)
├── settings.example.yaml commented settings template
├── crates/
│   ├── amibot-core/       IDs, descriptors, registry, resolution, manifest
│   ├── amibot-http/       ApiError, client-version middleware
│   ├── amibot-schema/     SeaORM entities (core tables only)
│   ├── amibot-migrations/ SeaORM migrator
│   ├── amibot-settings/   root YAML settings, ${VAR} interpolation, typed sections
│   ├── amibot-storage/    database connection, health, activation reads
│   └── amibot-runtime/    AppState, RuntimeModule trait
├── modules/
│   └── chat/             amibot-chat: ChatPanel, chat routes, OpenCode Go relay
└── tests/architecture.rs dependency guard
```

Dependency direction (enforced):

```text
core | schema | migrations | settings
        └── storage ──┐
http ── core          ├── runtime ── core
                      └── amibot-server (binary) ── chat
```

`amibot-core`, `amibot-schema`, `amibot-migrations`, and `amibot-settings` are
foundation crates with no internal dependencies. `amibot-runtime` depends only
on `amibot-core` internally; Axum and SeaORM are direct external dependencies.
Official modules such as `amibot-chat` depend on the foundation crates and are
registered by the binary.

## Run

```bash
cp .env.example .env
docker compose up -d db
cargo run
```

The server applies migrations at startup, then serves the API and the web build
from the configured `web_dir` (default `../frontend/dist`).

## Configuration

Server and module parameters live in `settings.yaml` (the authoritative source,
committed with no secrets). Copy `settings.example.yaml` for a documented
template. The file is a YAML mapping of named sections: the core reads the typed
`server:` section and each module deserializes its own section (for example
`chat:`) without changing the core. Only the `Root` scope and the `File` source
are implemented.

String scalars support `${VAR}` (required, startup fails if unset) and
`${VAR:-default}` (optional). Interpolation runs on the parsed YAML tree, so an
environment value containing YAML-special characters cannot break parsing, and
resolved values never appear in logs or errors.

- `AMIBOT_SETTINGS_FILE` selects the settings file (default `settings.yaml`,
  relative to the working directory; the Docker image places it at `/app`).
- `DATABASE_URL` (required) and `OPENCODE_GO_API_KEY` are secrets: keep their
  real values in `.env` (gitignored) and reference them by name in the YAML.
- `AMIBOT_CHAT_ENABLED` (default `true`) controls whether the chat module is
  registered; set it to `false` for a server with no chat UI and no `/chat`
  routes.
- `server:` values (`bind_addr`, `name`, `allowed_origins`, `web_dir`) may still
  be overridden through their `${VAR:-default}` environment variables.

Never log `DATABASE_URL` or the API key. `RUST_LOG` (default `info`) controls
tracing.

## API contract

- `GET /health` — `{ "status": "ok", "database": "ok" }` or `503` degraded.
- `GET /api/v1/app/manifest` — current manifest, rebuilt per request with one
  activation read. `Cache-Control: no-store`.
- `GET /api/v1/client-compatibility` — `{ "min_client_api_version": 1 }`,
  exempt from the client-version gate.
- `GET /api/v1/chat/models` — `{ "models": [{id,label}], "default_model" }`,
  `Cache-Control: no-store`; never returns the API key. Present only when the
  chat module is enabled.
- `POST /api/v1/chat` — body `{ "messages": [{ "role", "content" }], "model"?, "session_id"? }`.
  Relays the transcript (with the server-side preprompt) to the OpenAI-compatible
  OpenCode Go provider and returns the AI SDK v6 UI message stream
  (`text/event-stream`, `x-vercel-ai-ui-message-stream: v1`). `session_id` is a
  stable per-conversation value forwarded as `x-opencode-session`; when absent
  the server derives one from the transcript. No server-side history: the client
  sends the full transcript each request. A blank API key returns
  `503 chat_not_configured`; an upstream failure returns
  `502 chat_upstream_failed`; an invalid body or unknown model returns
  `400 bad_request`.
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

Modules are registered in `src/app/registry.rs`, which reads the shared
`SettingsStore`; the resolver rejects duplicate module/capability/contribution
IDs, missing or disabled required dependencies, self-dependencies, cycles, and
incompatible core requirements. The chat module is registered only when its
`chat.enabled` setting is true. Activation is read from `module_activation`: a
missing row means enabled, `enabled = false` disables. Activation currently
filters the manifest only; module routers are mounted at startup, so a disabled
`chat.enabled` also removes the `/api/v1/chat*` routes from that server.

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
