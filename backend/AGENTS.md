# Backend Guidelines

## Workspace layout

`backend/` is a Cargo workspace. The root package is the `amibot-server` binary
that wires everything together. Foundation crates live in `crates/`; official
modules will live in `modules/<short>/` with package name `amibot-<short>`.

Foundation crates:

- `amibot-core` — validated IDs, module descriptors, module/capability/UI
  registries, activation policy, deterministic resolution, manifest building,
  client-version contract, errors. No Axum, no SeaORM, no internal deps.
- `amibot-schema` — SeaORM entities. Core tables only; modules own their tables.
- `amibot-migrations` — SeaORM migrator for core tables.
- `amibot-storage` — database connection, ping, activation reads.
- `amibot-http` — `ApiError` JSON responses and the client-version middleware.
- `amibot-runtime` — `AppState` and `RuntimeModule`; depends on `amibot-core`
  only internally.

Dependency direction is enforced by `backend/tests/architecture.rs`:

```text
core | schema | migrations | http
        storage ── runtime ── core
                  amibot-server
```

- Foundation crates have no internal dependencies.
- `amibot-runtime` depends only on `amibot-core`.
- `amibot-storage` depends on `amibot-core` and `amibot-schema`.
- No crate depends on the `amibot-server` binary.
- Update `ALLOWED` deliberately when adding a crate or a module.

## Language and comments

English only in code, identifiers, comments, and documentation. Comments
explain non-obvious decisions; do not narrate readable code.

## Module contract

- Implement `amibot_core::Module` (`descriptor()`) and
  `amibot_runtime::RuntimeModule` (`api_router()`).
- Module ID: `^[a-z][a-z0-9_]{2,63}$` (`amibot_chat`).
- Capability, permission, and slot IDs are lowercase dot-separated segments
  (`chat.messages`, `app.header`).
- Contribution IDs are unique per module; the client key is `module:id`.
- `props` must be a JSON object.
- `platforms` absent means every platform; an empty array means none.
- Ordering is deterministic: `order`, then module ID, then contribution ID.

Routes returned by `api_router()` are relative to `/api/v1` and globally
unique. Axum panics on duplicate routes, so check path collisions when adding a
module. `/api/v1/client-compatibility` stays exempt from the version gate.

## Resolution and activation

`ModuleRegistry::resolve` validates the active graph and returns modules in
deterministic topological order with module ID as the tie-breaker. It rejects:

- duplicate modules, capabilities, or contributions;
- self-dependencies and cycles;
- missing or disabled required dependencies;
- core requirement mismatches.

`ActivationState` maps database rows: a missing row means enabled,
`enabled = false` disables. Unknown rows are reported and ignored. A required
dependency that is disabled makes resolution fail with
`module_resolution_failed`; the future lifecycle service will prevent that
state.

The manifest is rebuilt per request with one `SELECT`; there is no cache.
Module routers are merged at startup, so activation currently filters the
manifest only. Document that limitation until the lifecycle lands.

## Errors

`amibot_http::ApiError` owns the JSON error shape:

- `{ "error": ..., "code": ... }` for responses with a machine-readable code;
- `404` returns `{ "error": "not found" }` without a code;
- database failures return `503 database_unavailable`;
- manifest resolution/build failures return `500 module_resolution_failed`.

Never leak database URLs, SQL, or internal error strings to clients.

## HTTP composition

Composition lives in `src/app/`:

- `startup.rs` initializes tracing, config, database, migrations, registry,
  state, router, CORS, and graceful shutdown.
- `router.rs` owns `/health`, nests `/api`, and falls back to the web build.
- `api.rs` nests `/api/v1`, applies the version middleware to protected routes,
  and returns JSON 404 for unknown API paths.
- `web.rs` serves `AMIBOT_WEB_DIR` and falls back to `index.html`; a missing
  build directory leaves the API usable.
- `registry.rs` is the only module wiring point.

CORS uses an explicit origin list with credentials enabled; `*` is rejected.

## Validation and tests

- `cargo fmt --all -- --check`
- `cargo clippy --workspace --all-targets -- -D warnings`
- `cargo test --workspace`
- `cargo test --test architecture`

Unit tests stay inline in `#[cfg(test)]` modules next to the code. They cover
pure rules, serialization, config parsing, and error mapping. They must stay
fast and free of Docker, network, and environment mutation. HTTP contracts
belong to Hurl under `tests/api/`; do not duplicate them here.

Do not add DB-backed integration tests to `backend/tests/` without a dedicated
ignored suite.

## Migrations

- Never modify an applied migration; add a new one.
- Core schema changes belong to `amibot-schema` and `amibot-migrations`.
- Module schema changes belong to the module crate.
- Do not run migrations against shared environments.

## Rules

- No `unwrap` or `expect` outside tests.
- No silent error swallowing.
- Do not add a dependency or bump a version without asking.
- Never ship remote JavaScript or execute module code downloaded at runtime.
