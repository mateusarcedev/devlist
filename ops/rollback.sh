#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

STATE_DIR="$ROOT_DIR/.deploy"
PREVIOUS_FILE="$STATE_DIR/previous-tag"
ROLLBACK_TAG="${1:-}"

if [ -z "$ROLLBACK_TAG" ]; then
  if [ ! -f "$PREVIOUS_FILE" ]; then
    echo "No previous deployment tag recorded." >&2
    echo "Usage: ./ops/rollback.sh <git-sha-or-image-tag>" >&2
    exit 1
  fi
  ROLLBACK_TAG="$(cat "$PREVIOUS_FILE")"
fi

echo "Rolling application images back to: $ROLLBACK_TAG"
echo "Database restore is NOT automatic. See docs/deployment.md for migration caveats."

SKIP_BACKUP=1 sh ./ops/deploy.sh "$ROLLBACK_TAG"
