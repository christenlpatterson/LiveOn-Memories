#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/Digital_Scrapbook"
PYTHON="$FRONTEND_DIR/.venv/bin/python"

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$FLASK_PID" "$VITE_PID" 2>/dev/null
  wait "$FLASK_PID" "$VITE_PID" 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# ── Start Flask ──────────────────────────────────────────────────────────────
echo "Starting Flask backend on http://localhost:5000 ..."
cd "$BACKEND_DIR"
"$PYTHON" app.py &
FLASK_PID=$!

# Give Flask a moment to bind the port
sleep 1

# ── Start Vite ───────────────────────────────────────────────────────────────
echo "Starting Vite frontend on http://localhost:5173 ..."
cd "$FRONTEND_DIR"
npm run dev &
VITE_PID=$!

echo ""
echo "  Flask  → http://localhost:5000"
echo "  Vite   → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for either process to exit
wait -n "$FLASK_PID" "$VITE_PID" 2>/dev/null || wait
