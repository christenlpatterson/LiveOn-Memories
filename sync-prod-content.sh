#!/usr/bin/env bash
set -euo pipefail

# Recurring production-content sync helper.
#
# Run from repo root with:
#   ./sync-prod-content.sh
#
# Important:
# - Use "./sync-prod-content.sh" (not "sync-prod-content.sh") so shell executes the local file.
# - Do not use placeholder URLs like <your-real-render-backend-url>.
# - This script already defaults to the real production backend URL below.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_BASE_DEFAULT="https://liveon-memories.onrender.com"

# You can temporarily override with:
#   API_BASE=https://other-backend.onrender.com ./sync-prod-content.sh
API_BASE="${API_BASE:-$API_BASE_DEFAULT}"

# Default behavior replaces local DB/media with production snapshot.
# Pass --no-reset to merge instead.
RESET_FLAG="--reset"

# --export-only sets this to true and skips local hydrate.
SKIP_HYDRATE="false"

usage() {
  cat <<'EOF'
Usage:
  ./sync-prod-content.sh [options]

Options:
  --api-base URL     Override production backend URL (default: https://liveon-memories.onrender.com)
  --no-reset         Merge into local DB/media instead of replacing local content
  --export-only      Export backup bundle only, skip local hydrate
  -h, --help         Show this help

Examples:
  ./sync-prod-content.sh
  ./sync-prod-content.sh --no-reset
  ./sync-prod-content.sh --export-only
  ./sync-prod-content.sh --api-base https://other-backend.onrender.com
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-base)
      shift
      if [[ $# -eq 0 ]]; then
        echo "Missing value for --api-base" >&2
        exit 2
      fi
      API_BASE="$1"
      ;;
    --no-reset)
      RESET_FLAG=""
      ;;
    --export-only)
      SKIP_HYDRATE="true"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

cd "$ROOT_DIR"

# Delegate to the generic sync script:
#   pull = export from production + hydrate local
CMD=("./sync-content.sh" "pull" "--api-base" "$API_BASE")

if [[ -n "$RESET_FLAG" ]]; then
  CMD+=("$RESET_FLAG")
fi

if [[ "$SKIP_HYDRATE" == "true" ]]; then
  CMD+=("--skip-hydrate")
fi

echo "Running: ${CMD[*]}"
"${CMD[@]}"
