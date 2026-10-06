#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: CONFIRM_RESTORE=YES ./ops/restore-postgres.sh <backup.dump>" >&2
  exit 1
fi

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  echo "Refusing restore without CONFIRM_RESTORE=YES" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing .env in $ROOT_DIR" >&2
  exit 1
fi

set -a
. ./.env
set +a

echo "Stopping public application services before restore..."
docker compose stop caddy web api

echo "Restoring PostgreSQL from: $BACKUP_FILE"
echo "Existing database objects may be replaced."

docker compose exec -T postgres   pg_restore   --clean   --if-exists   --no-owner   --no-privileges   --username "$POSTGRES_USER"   --dbname "$POSTGRES_DB"   < "$BACKUP_FILE"

echo "Restore completed."
echo "Application services remain stopped intentionally."
echo "Deploy a database-compatible application tag with:"
echo "  sh ./ops/deploy.sh <git-sha-or-image-tag>"
