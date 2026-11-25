# Deployment

Amibot is a single server process plus PostgreSQL. The repository ships a
Docker Compose stack for self-hosting; there is no Swarm, Kubernetes, or managed
control plane in this skeleton.

## Stack

`docker-compose.yml` runs:

- `db` — PostgreSQL 17 with a named volume;
- `server` — the `amibot-server` image, serving the API and the embedded Expo Web
  build on port `3000`.

```bash
docker compose up -d --build
docker compose logs -f server
```

The first build compiles the web client and the Rust binary and is slow. Later
builds reuse the Docker layer cache.

## Configuration

| Variable                | Required | Default            |
| ----------------------- | -------- | ------------------ |
| `DATABASE_URL`          | yes      | —                  |
| `AMIBOT_BIND_ADDR`       | no       | `0.0.0.0:3000`     |
| `AMIBOT_SERVER_NAME`     | no       | `Amibot`            |
| `AMIBOT_ALLOWED_ORIGINS` | no       | empty (same-origin)|
| `AMIBOT_WEB_DIR`         | no       | `/app/web` in image|
| `RUST_LOG`              | no       | `info`             |

`AMIBOT_ALLOWED_ORIGINS` is a comma-separated list for cross-origin clients such
as Expo Web development (`http://localhost:8081`). Credentials are enabled, so
`*` is rejected. The embedded web build is same-origin and needs no CORS entry.

The compose file uses development credentials (`amibot`/`amibot`). Replace them
before exposing an instance. Keep production secrets outside the repository,
for example in an untracked `.env` read by Compose or in your orchestrator's
secret store.

## Reverse proxy and TLS

Terminate TLS in a reverse proxy (Caddy, nginx, Traefik) and forward to
`127.0.0.1:3000`. Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
The server itself does not manage certificates.

## PostgreSQL

The named volume `amibot-db` holds the database. Back it up with `pg_dump` or a
filesystem snapshot:

```bash
docker compose exec -T db pg_dump -U amibot amibot > backup.sql
```

Migrations run automatically at startup. Do not edit an applied migration; ship
a new one. Test migrations against a copy of production data before deploying.

## Updates

```bash
git pull
docker compose up -d --build
```

Roll back by checking out the previous revision and rebuilding. Database
migrations are forward-only in this skeleton; keep a recent backup before an
update that changes the schema.

## Limits

- Single instance only; no high availability or horizontal scaling.
- No admin UI, account system, or module lifecycle yet.
- Activation rows filter the manifest only; module route routers are mounted at
  startup.
- No built-in TLS, metrics, or log shipping.
