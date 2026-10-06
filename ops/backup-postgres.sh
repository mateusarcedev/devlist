#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Missing .env in $ROOT_DIR" >&2
  exit 1
fi

set -a
. ./.env
set +a

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/tools4tech-$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "Creating PostgreSQL backup: $BACKUP_FILE"
docker compose exec -T postgres   pg_dump   --format=custom   --no-owner   --no-privileges   --username "$POSTGRES_USER"   --dbname "$POSTGRES_DB"   > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"

find "$BACKUP_DIR"   -type f   -name 'tools4tech-*.dump'   -mtime "+$BACKUP_RETENTION_DAYS"   -delete

echo "$BACKUP_FILE"
