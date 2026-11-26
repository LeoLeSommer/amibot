#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/tests/docker-compose.test.yml"
MAESTRO_DIR="$ROOT_DIR/tests/web/maestro"
PROJECT_NAME="amibot-e2e"
BASE_URL="http://localhost:3200"
FLOW="home-empty"
KEEP=0

usage() {
    printf 'Usage: %s [--flow <name>] [--chat] [--keep]\n' "$0"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --flow)
            FLOW="${2:?--flow requires a value}"
            shift 2
            ;;
        --chat)
            BASE_URL="http://localhost:3201"
            FLOW="chat"
            shift
            ;;
        --keep)
            KEEP=1
            shift
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

FLOW_FILE="$MAESTRO_DIR/$FLOW.yaml"
if [[ ! -f "$FLOW_FILE" ]]; then
    printf 'Unknown flow: %s\n' "$FLOW" >&2
    exit 2
fi

for tool in docker maestro; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        printf '%s is required\n' "$tool" >&2
        exit 1
    fi
done

cleanup() {
    if [[ "$KEEP" -eq 0 ]]; then
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --build --wait

MAESTRO_CLI_NO_ANALYTICS=1 maestro test \
    -e "BASE_URL=$BASE_URL" \
    -e "APP_ID=app.amibot" \
    "$FLOW_FILE"
