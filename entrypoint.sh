#!/bin/bash
set -euo pipefail

# Configurable runtime options
PORT="${PORT:-${DEVBOX_PORT:-${APP_PORT:-4173}}}"
HOST="${HOST:-0.0.0.0}"
SERVE_DIR="${SERVE_DIR:-dist}"
SERVE_TOOL="${SERVE_TOOL:-serve}"   # Supported: serve | http-server
SKIP_BUILD="${SKIP_BUILD:-false}"

log() {
  printf '[entrypoint] %s\n' "$*"
}

# Ensure dependencies and build output exist unless explicitly skipped
if [[ "${SKIP_BUILD}" != "true" ]]; then
  if [[ ! -d "${SERVE_DIR}" || ! -f "${SERVE_DIR}/index.html" ]]; then
    log "Static assets missing. Installing dependencies and building..."
    npm install --omit=dev
    npm run build
  fi
fi

if [[ ! -d "${SERVE_DIR}" ]]; then
  log "❌ Build output directory '${SERVE_DIR}' not found." >&2
  exit 1
fi

log "Serving '${SERVE_DIR}' on ${HOST}:${PORT} using ${SERVE_TOOL}"

case "${SERVE_TOOL}" in
  serve)
    exec npx --yes serve -s "${SERVE_DIR}" -l "${HOST}:${PORT}"
    ;;
  http-server)
    exec npx --yes http-server "${SERVE_DIR}" -p "${PORT}" -a "${HOST}" --cors
    ;;
  *)
    log "Unknown SERVE_TOOL='${SERVE_TOOL}'. Supported options: serve | http-server" >&2
    exit 1
    ;;
esac
