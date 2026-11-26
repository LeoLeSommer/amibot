# Tests

Three layers, each with one job:

| Suite    | Covers                                            | Runs in CI |
| -------- | ------------------------------------------------- | ---------- |
| Rust     | pure backend rules and serialization              | yes        |
| Jest     | pure frontend logic                               | yes        |
| Hurl     | HTTP status codes, headers, JSON contracts        | yes        |
| Maestro  | browser and device user journeys                  | no         |

Do not duplicate HTTP contracts in Jest, or UI logic in Hurl. Maestro is
local-only because it needs Chromium or an emulator.

## API contracts (Hurl)

```bash
npm run test:api                 # build the test stack, run Hurl, tear down
npm run test:api -- --chat       # also run the chat contracts against 3201
npm run test:api -- --keep       # keep the stack after the run
npm run test:api -- --base-url http://localhost:3000
```

`--base-url` reuses an existing server and skips starting the stack. Without
it, `tests/api/run.sh` builds `tests/docker-compose.test.yml` and waits for the
server healthcheck. `--chat` runs the default contracts first, then the chat
contracts in `tests/api/hurl-chat/` against the chat-enabled server. Ports:

- server and web: `3200` (chat disabled)
- chat-enabled server and web: `3201`
- PostgreSQL: `55433`

The project name is `amibot-e2e`; teardown is `docker compose ... down -v`. The
stack has two servers built with `EXPO_PUBLIC_APP_LOCALE=en` and
`AMIBOT_SERVER_NAME=Amibot E2E`: `server` sets `AMIBOT_CHAT_ENABLED=false` so
the existing "0 modules" manifest assertion stays valid, and `server-chat`
sets `AMIBOT_CHAT_ENABLED=true`. Neither carries a real API key, so a valid
chat request deterministically returns `503 chat_not_configured`.

Default Hurl files live in `tests/api/hurl/`; chat contracts live in
`tests/api/hurl-chat/` with their own `fixtures.env` (`base_url` = 3201).
Shared variables live in `fixtures.env`; do not redeclare them in individual
files. Add one assertion per contract field, and keep unknown API routes as
JSON `404` checks.

## Browser flows (Maestro Web)

```bash
npm run test:web                         # home-empty flow (3200)
npm run test:web -- --flow home-empty
npm run test:web -- --chat               # chat flow (3201)
npm run test:web -- --keep
```

`--chat` sets `BASE_URL=http://localhost:3201` and `FLOW=chat`, so the browser
drives the chat-enabled server. The runner starts the Docker test stack and
drives the embedded web build, so it does not need Metro. Flows live in
`tests/web/maestro/` and assert English labels because the image is built with
`EXPO_PUBLIC_APP_LOCALE=en`. Tapping send on the keyless chat server reaches the
`chat-error` state without a real LLM call.

React Native Web maps `nativeID` to the DOM `id` attribute and `testID` to
`data-testid`. Flows use `id:` selectors; keep both attributes on interactive
controls.

Maestro Web cannot erase prefilled inputs and CSS selectors are slow. Prefer
stable IDs and visible labels.

## Mobile flows (Maestro)

```bash
npm run test:mobile:android -- --flow settings-empty
npm run test:mobile:ios -- --flow settings-empty
```

These require:

- Maestro installed;
- a booted Android emulator or iOS simulator with the app installed;
- dependencies installed in `frontend/`.

The runner starts Metro with `CI=1`, `EXPO_NO_TELEMETRY=1`,
`EXPO_PUBLIC_APP_LOCALE=en`, and an empty server URL so the app opens on the
settings screen. Logs go to `tests/metro.log` (gitignored). On Android, it runs
`adb reverse` for the Metro port when `adb` is available.

Mobile flows live in `tests/mobile/maestro/` and use `appId: app.amibot`.

## Conventions

- Maestro flow text is English in this skeleton; assert localized labels with
  `EXPO_PUBLIC_APP_LOCALE=en` pinned.
- Keep `testID` values stable: `home-empty-title`, `settings-open`,
  `settings-title`, `server-url-input`, `server-connect`, `server-disconnect`,
  `server-status`, `appearance-settings`, `theme-option-default`,
  `theme-option-ocean`, `theme-option-forest`, `mode-option-auto`,
  `mode-option-light`, `mode-option-dark`, `chat-panel`, `chat-empty-title`,
  `chat-input`, `chat-send`, `chat-model-selector`, `chat-error`, `chat-retry`.
- Do not run every Maestro flow for a small change; run the affected flow.
- Shell scripts are validated with `bash -n` and, when available,
  `shellcheck`.
