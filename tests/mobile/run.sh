#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
METRO_PORT=8081
FLOW="settings-empty"
PLATFORM="${1:-}"
METRO_PID=""

usage() {
    printf 'Usage: %s android|ios [--flow <name>]\n' "$0"
}

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
    usage >&2
    exit 2
fi
shift

while [[ $# -gt 0 ]]; do
    case "$1" in
        --flow)
            FLOW="${2:?--flow requires a value}"
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

FLOW_FILE="$ROOT_DIR/tests/mobile/maestro/$FLOW.yaml"
if [[ ! -f "$FLOW_FILE" ]]; then
    printf 'Unknown flow: %s\n' "$FLOW" >&2
    exit 2
fi

if ! command -v maestro >/dev/null 2>&1; then
    printf 'maestro is required\n' >&2
    exit 1
fi

cleanup() {
    if [[ -n "$METRO_PID" ]]; then
        kill "$METRO_PID" >/dev/null 2>&1 || true
        wait "$METRO_PID" >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

if [[ "$PLATFORM" == "android" ]]; then
    if command -v adb >/dev/null 2>&1; then
        adb reverse tcp:"$METRO_PORT" tcp:"$METRO_PORT" >/dev/null 2>&1 || true
    fi
fi

printf 'Starting Metro on port %s\n' "$METRO_PORT"
(
    cd "$ROOT_DIR/frontend"
    exec env CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_APP_LOCALE=en EXPO_PUBLIC_AMIBOT_SERVER_URL= \
        npx expo start --port "$METRO_PORT"
) >"$ROOT_DIR/tests/metro.log" 2>&1 &
METRO_PID=$!

for _ in {1..120}; do
    if curl -fsS "http://localhost:$METRO_PORT/status" >/dev/null 2>&1; then
        break
    fi
    if ! kill -0 "$METRO_PID" >/dev/null 2>&1; then
        printf 'Metro exited before becoming ready; see tests/metro.log\n' >&2
        exit 1
    fi
    sleep 1
done

if ! curl -fsS "http://localhost:$METRO_PORT/status" >/dev/null 2>&1; then
    printf 'Metro did not become ready; see tests/metro.log\n' >&2
    exit 1
fi

MAESTRO_CLI_NO_ANALYTICS=1 maestro test \
    -e "APP_ID=app.amibot" \
    -e "PLATFORM=$PLATFORM" \
    "$FLOW_FILE"
