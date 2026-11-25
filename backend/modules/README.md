# Official modules

Future official modules live here, one directory per module:

```text
modules/<short>/
├── Cargo.toml        # package amibot-<short>
└── src/
    ├── lib.rs
    └── ...
```

Conventions:

- Crate package: `amibot-<short>`; module ID: `amibot_<short>` (for example
  `modules/chat` provides `amibot_chat`).
- Implement `amibot_core::Module` and `amibot_runtime::RuntimeModule`.
- `api_router()` returns a `Router<AppState>` whose paths are relative to
  `/api/v1` and globally unique. A duplicate route makes Axum panic at startup.
- Register the module in `backend/src/app/registry.rs`.
- Declare module dependencies with `ModuleDependency`; the resolver rejects
  missing required dependencies, disabled required dependencies, and cycles.
- The module owns its SeaORM entities and migrations. Never edit an applied
  migration and never put module tables in `amibot-schema`.
- Allowed internal dependencies: `amibot-core`, `amibot-runtime`,
  `amibot-schema`, `amibot-storage`, `amibot-http`, `amibot-migrations` as needed.
  Cross-module calls go through the other module's public API.
- Update `ALLOWED` in `backend/tests/architecture.rs` when adding a module.
- Never download or execute JavaScript at runtime. UI contributions reference
  components compiled into the client catalogue.
