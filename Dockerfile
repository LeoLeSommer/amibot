# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ARG EXPO_PUBLIC_APP_LOCALE=""
ENV EXPO_PUBLIC_APP_LOCALE=$EXPO_PUBLIC_APP_LOCALE
RUN npx expo export --platform web

FROM rust:1.94-bookworm AS rust
WORKDIR /app/backend
COPY backend/ ./
RUN cargo build --release --locked

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --system --home /app --shell /usr/sbin/nologin amibot
WORKDIR /app
COPY --from=rust /app/backend/target/release/amibot-server /app/amibot-server
COPY --from=web /app/frontend/dist /app/web
ENV AMIBOT_WEB_DIR=/app/web
ENV AMIBOT_BIND_ADDR=0.0.0.0:3000
EXPOSE 3000
USER amibot
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3000/health || exit 1
CMD ["/app/amibot-server"]
