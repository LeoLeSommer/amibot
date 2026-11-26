#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/tests/docker-compose.test.yml"
HURL_DIR="$ROOT_DIR/tests/api/hurl"
CHAT_DIR="$ROOT_DIR/tests/api/hurl-chat"
PROJECT_NAME="amibot-e2e"
BASE_URL="${BASE_URL:-}"
CHAT=0
KEEP=0
START_STACK=1

usage() {
    printf 'Usage: %s [--keep] [--chat] [--base-url <url>]\n' "$0"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --keep)
            KEEP=1
            shift
            ;;
        --chat)
            CHAT=1
            shift
            ;;
        --base-url)
            BASE_URL="${2:?--base-url requires a value}"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage >&2
            exit 2
            ;;
    esac
done

if [[ -n "$BASE_URL" ]]; then
    START_STACK=0
else
    BASE_URL="http://localhost:3200"
fi

if ! command -v docker >/dev/null 2>&1; then
    printf 'docker is required\n' >&2
    exit 1
fi

if ! command -v hurl >/dev/null 2>&1; then
    printf 'hurl 8.x is required\n' >&2
    exit 1
fi

cleanup() {
    if [[ "$START_STACK" -eq 1 && "$KEEP" -eq 0 ]]; then
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

dump_logs() {
    if [[ "$START_STACK" -eq 1 ]]; then
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color "$1" || true
    fi
}

if [[ "$START_STACK" -eq 1 ]]; then
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --build --wait
else
    printf 'Using existing server at %s\n' "$BASE_URL"
fi

if ! hurl --test \
    --variables-file "$HURL_DIR/fixtures.env" \
    --variable "base_url=$BASE_URL" \
    "$HURL_DIR"/*.hurl; then
    dump_logs server
    exit 1
fi

if [[ "$CHAT" -eq 1 ]]; then
    if ! hurl --test \
        --variables-file "$CHAT_DIR/fixtures.env" \
        "$CHAT_DIR"/*.hurl; then
        dump_logs server-chat
        exit 1
    fi
fi
