# Repository Guidelines

Amibot is a modular application shell: a Rust server with a compiled module
registry, a versioned JSON API, an embedded Expo Web client, and a React Native
client sharing the same source.

## Working agreement

- Do not stage, commit, push, tag, amend, rebase, or open pull requests unless
  explicitly asked. Leave changes in the working tree and list the files you
  touched. When asked to commit, stage only the files changed for that task.
- Read-only git is fine: `status`, `diff`, `log`, `show`. Never run destructive
  commands (`reset --hard`, `clean -fd`, `checkout -- .`, `branch -D`) without
  an explicit instruction.
- Never read, print, or edit secrets: `.env*` files other than `.env.example`,
  CI secrets, or deployment secrets. Refer to variable names only.
- Never edit an applied migration; add a new one. Never run migrations against
  a shared environment; local Docker databases are fine.
- Do not add a dependency, bump a version, or rewrite a lockfile without asking
  first.
- Do not edit generated artifacts (`frontend/dist`, `frontend/ios`,
  `frontend/android`, lockfiles) unless the task is about them.
- Do not create summary, report, or notes files unless asked; answer in chat.

## Change discipline

- Read the target file, its callers, and the owning module before editing. Never
  infer a route, signature, column, config key, or script name; confirm it in
  the source.
- Ship the minimum diff. No opportunistic refactors, renames, reordering,
  formatting sweeps, or comment rewrites.
- One logical change per task. If the request contains several, do the asked one
  and list the rest in one line.
- Report adjacent problems in one line; fix them only when they block the task.
- Never weaken or delete a failing test, assertion, lint rule, or type to make a
  check pass. Fix the cause; if the test itself is wrong, say so and ask.
- Do not silence errors (`unwrap`, `expect`, `as any`, `@ts-ignore`, empty
  `catch`) to make a check pass.
- Ask one question when two readings of the request lead to different
  implementations. Otherwise state the assumption in one line and proceed.
- Ask before work that is hard to undo: schema migrations, API contract changes,
  deleting data, auth or security behavior, or changes spanning several crates
  and features.

## Token economy

- Locate with `rg` or glob, then read only the relevant range.
- Batch independent reads and searches in one turn.
- Filter large outputs at the source and quote the shortest decisive line.
- Run each validation once. Prefer the affected flow over the full suite.

## Communication

- Answer first: result, then reason. No greeting, no preamble, no restating the
  request.
- Normal prose. No decorative tables, emoji, or filler. Flag uncertainty
  explicitly ("assumed", "not verified") instead of hedging.
- Back "works", "tested", or "fixed" with the command or file that proves it.
  If a check was skipped, say why in one line.

## Layout

- `backend/` — Rust (Axum + SeaORM/PostgreSQL) server. The root package is the
  `amibot-server` binary; foundation crates live in `backend/crates/`; future
  official modules live in `backend/modules/`. See `backend/AGENTS.md`.
- `frontend/` — Expo / React Native app served on web, iOS, and Android. See
  `frontend/AGENTS.md`.
- `tests/` — Hurl API contracts and Maestro web/mobile journeys. See
  `tests/README.md`.
- `deploy/` — self-hosting notes for Docker Compose, TLS, backups. See
  `deploy/README.md`.

## Architecture rules

The backend dependency graph is enforced by
`backend/tests/architecture.rs`; update its `ALLOWED` table deliberately when a
crate edge changes. Foundation crates (`amibot-core`, `amibot-schema`,
`amibot-migrations`) have no internal dependencies. `amibot-runtime` depends only
on `amibot-core`. No crate depends on the `amibot-server` binary. Official
modules will live in `backend/modules/<short>/` with package
`amibot-<short>`.

The frontend layer graph is enforced by `eslint-plugin-boundaries`:
`app → feature → shared → lib`, plus `i18n` and `constants` at the bottom.
Features never import another feature. See `frontend/AGENTS.md`.

Modules never ship JavaScript at runtime: no remote code loading.

## Test commands

Run these from the repository root:

- `npm run test:backend` — Rust workspace unit tests (fast, no Docker)
- `npm run test:arch` — dependency guard
- `npm run fmt:backend` — rustfmt check
- `npm run clippy:backend` — clippy with warnings denied
- `npm run test:frontend` — Jest unit tests (fast, no Docker)
- `npm run lint:frontend`, `npm run typecheck:frontend`,
  `npm run format:frontend:check` — frontend checks
- `npm run test:api` — Hurl API and web contracts against the Docker test stack
- `npm run test:web -- --flow <name>` — one Maestro browser flow
- `npm run test:mobile:android -- --flow <name>` — one Android flow
- `npm run test:mobile:ios -- --flow <name>` — one iOS flow

Unit boundaries: `cargo test` and Jest cover pure logic; Hurl covers HTTP
contracts; Maestro covers device and browser journeys. Do not duplicate one
layer in another.

## Validation before finishing

- Backend change: `npm run test:backend`, `npm run clippy:backend`, and
  `npm run test:arch` when crate edges change.
- API or web route change: `npm run test:api`.
- Frontend change: from `frontend/`, run `npx expo lint`, `npx tsc --noEmit`,
  `npm run format:check`, and `npm test`.
- Mobile flow change: run the affected flow locally if the environment exists.
- Container change: `docker compose config` and
  `docker compose -f tests/docker-compose.test.yml config`.
- Shell script change: `bash -n` on the script, plus `shellcheck` when
  available.

Do not run the entire Maestro suite unless it is really necessary; prefer the
flow that covers the change.

## Language

English only in code, identifiers, comments, documentation, and commit
messages. User-facing strings live in `frontend/src/i18n/locales/` (`en` and
`fr`). Maestro flows assert English labels with
`EXPO_PUBLIC_APP_LOCALE=en`.

## Plans

When the user asks to save a plan, write it as Markdown under `./plans` and
open the saved file in Zed. `plans/` is gitignored and local only.
