#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Missing .env. Copy .env.example to .env and configure production values." >&2
  exit 1
fi

set -a
. ./.env
set +a

DEPLOY_TAG="${1:-${IMAGE_TAG:-latest}}"
STATE_DIR="$ROOT_DIR/.deploy"
CURRENT_FILE="$STATE_DIR/current-tag"
PREVIOUS_FILE="$STATE_DIR/previous-tag"

mkdir -p "$STATE_DIR"

CURRENT_TAG=""
if [ -f "$CURRENT_FILE" ]; then
  CURRENT_TAG="$(cat "$CURRENT_FILE")"
fi

export IMAGE_TAG="$DEPLOY_TAG"

echo "Deploying Tools4.tech image tag: $IMAGE_TAG"

docker compose pull postgres migrate api web caddy

docker compose up -d postgres

echo "Waiting for PostgreSQL..."
attempt=0
until docker compose exec -T postgres   pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1
do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "PostgreSQL did not become ready." >&2
    exit 1
  fi
  sleep 2
done

if [ "${SKIP_BACKUP:-0}" != "1" ]; then
  sh ./ops/backup-postgres.sh >/dev/null
fi

echo "Applying database migrations..."
docker compose run --rm migrate

echo "Starting application services..."
docker compose up -d api web caddy

echo "Waiting for public health checks..."
attempt=0
until curl --fail --silent --show-error   "${API_URL%/}/health/ready" >/dev/null 2>&1
do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 45 ]; then
    echo "API public readiness check failed." >&2
    exit 1
  fi
  sleep 2
done

attempt=0
until curl --fail --silent --show-error   "${FRONTEND_URL%/}" >/dev/null 2>&1
do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 45 ]; then
    echo "Frontend public smoke check failed." >&2
    exit 1
  fi
  sleep 2
done

if [ -n "$CURRENT_TAG" ] && [ "$CURRENT_TAG" != "$DEPLOY_TAG" ]; then
  printf '%s\n' "$CURRENT_TAG" > "$PREVIOUS_FILE"
fi

printf '%s\n' "$DEPLOY_TAG" > "$CURRENT_FILE"

echo "Deployment healthy: $DEPLOY_TAG"
