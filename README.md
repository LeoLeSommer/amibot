# Amibot

Amibot is a self-hosted, modular application shell. The server owns a compiled
module registry, exposes a versioned JSON API, and serves the Expo Web client
from the same origin. The client renders module UI contributions through a
small slot catalogue.

This repository is a skeleton: it contains the foundations, not a product. No
chat, accounts, conversations, agent runtime, desktop app, admin UI, or
marketplace.

The design intent and architectural principles are stated in
[`VISION.md`](VISION.md).

## Current state

- Rust workspace with a single `amibot-server` binary and six foundation crates.
- PostgreSQL 17 schema with one table, `module_activation`.
- Empty v1 manifest served at `/api/v1/app/manifest`.
- Expo Web build embedded in the server image and served at `/`.
- Minimal mobile/web client with server settings and an empty module surface.
- Hurl API contracts and local Maestro flows; Jest unit tests.

## Quickstart with Docker

```bash
docker compose up --build
```

Open <http://localhost:3000>. The embedded web client connects to the same
origin, reads the manifest, and shows the empty module state.

The compose file uses development-only database credentials. See
[`deploy/README.md`](deploy/README.md) before exposing an instance.

## Local development

Backend (requires a reachable PostgreSQL and `DATABASE_URL`):

```bash
cp backend/.env.example backend/.env
docker compose up -d db
cargo run --manifest-path backend/Cargo.toml
```

Frontend:

```bash
cd frontend
npm install
npm run web
```

Expo Web development runs on `http://localhost:8081`; set
`EXPO_PUBLIC_AMIBOT_SERVER_URL=http://localhost:3000` in
`frontend/.env.local` or use the settings screen to connect.

On an Android emulator, the host machine is `10.0.2.2`, so connect to
`http://10.0.2.2:3000`.

## Structure

```text
backend/    Cargo workspace: binary, foundation crates, future modules
frontend/   Expo / React Native / Expo Router client
tests/      Hurl API contracts and Maestro journeys
deploy/     Self-hosting notes
```

## Configuration

| Variable                 | Default             | Purpose                                   |
| ------------------------ | ------------------- | ----------------------------------------- |
| `DATABASE_URL`           | required            | PostgreSQL connection string              |
| `AMIBOT_BIND_ADDR`        | `0.0.0.0:3000`      | HTTP listen address                       |
| `AMIBOT_SERVER_NAME`      | `Amibot`             | Name reported in the manifest             |
| `AMIBOT_ALLOWED_ORIGINS`  | empty               | Comma-separated CORS origins (no `*`)     |
| `AMIBOT_WEB_DIR`          | `../frontend/dist`  | Directory of the Expo Web build           |
| `RUST_LOG`               | `info`              | Tracing filter                            |

## Tests

```bash
npm run test:backend     # Rust unit tests
npm run test:arch        # dependency guard
npm run clippy:backend
npm run test:frontend    # Jest
npm run test:api         # Hurl against the Docker test stack
npm run test:web         # local Maestro browser flow
```

Maestro mobile flows require a running emulator or simulator and a local Metro
server; they are not part of CI.

## Roadmap

1. Module lifecycle (install, enable, disable, dependencies).
2. Identity and sessions.
3. First official module, `amibot_chat`, and its agent runtime.
4. Declarative UI beyond slots.
