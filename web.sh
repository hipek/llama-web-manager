#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Copy .env.example → .env if not exists (one-time setup)
if [ ! -f "$FRONTEND_DIR/.env" ]; then
  echo "[web.sh] Creating frontend/.env from .env.example"
  cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
fi

# Kill leftover processes on exit
cleanup() {
  echo ""
  echo "[web.sh] Shutting down..."
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start Python backend
echo "[web.sh] Starting backend (uvicorn)..."
cd "$ROOT_DIR"
uv run -m backend.main &
BACKEND_PID=$!

# Start frontend dev server
echo "[web.sh] Starting frontend (next dev)..."
cd "$FRONTEND_DIR"
pnpm dev &
FRONTEND_PID=$!

WEB_PORT=$(grep -E '^\s*web_port:\s*[0-9]+' "$ROOT_DIR/config.yaml" | head -1 | awk '{print $2}')
FRONTEND_PORT=8000
API_URL=$(grep '^NEXT_PUBLIC_API_URL=' "$FRONTEND_DIR/.env.local" | cut -d= -f2)
echo ""
echo "  Backend:  http://0.0.0.0:${WEB_PORT}"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  API:      ${API_URL}"
echo ""
echo "  Press Ctrl+C to stop both."
echo ""

# Wait for either process to exit
wait -n "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
