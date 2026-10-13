# Production deployment

This runbook deploys **Devlist** on a single Linux VPS using Docker Compose, Caddy, PostgreSQL, and immutable GHCR images.

## Target topology

```text
Internet
  │
  ├── devlist.mateusarce.dev ─────┐
  └── api.devlist.mateusarce.dev ─┤
                                  ▼
                          Caddy :80/:443
                           │          │
                           ▼          ▼
                       web:3000    api:3001
                                      │
                                      ▼
                                postgres:5432
```

Only Caddy exposes host ports. PostgreSQL stays on the private `backend` Docker network.

## VPS requirements

Recommended baseline:

- Ubuntu 24.04 LTS or another currently supported Linux distribution;
- Docker Engine + Docker Compose plugin;
- Git;
- curl;
- enough disk space for Docker images, PostgreSQL data, Caddy certificates, and backups.

Firewall:

- allow SSH from trusted administration sources;
- allow TCP 80;
- allow TCP 443;
- allow UDP 443 for HTTP/3;
- do **not** expose 3000, 3001, or 5432 publicly.

## DNS

Before the first public deploy, point these records to the VPS public IP:

| Host | Type | Target |
| --- | --- | --- |
| `devlist.mateusarce.dev` | A/AAAA | VPS |
| `api.devlist.mateusarce.dev` | A/AAAA | VPS |

Caddy obtains and renews TLS certificates automatically after DNS resolves and ports 80/443 are reachable.

## GitHub OAuth

Create or update the production GitHub OAuth App:

```text
Homepage URL:
https://devlist.mateusarce.dev

Authorization callback URL:
https://api.devlist.mateusarce.dev/auth/callback/github
```

Use its client ID/secret in the VPS `.env`.

## Container images

`.github/workflows/publish-images.yml` publishes three images to GHCR on every push to `main`:

```text
ghcr.io/mateusarcedev/devlist-api:<git-sha>
ghcr.io/mateusarcedev/devlist-migrate:<git-sha>
ghcr.io/mateusarcedev/devlist-web:<git-sha>
```

The same images also receive `latest`, but production must not use it: `docker-compose.yml` requires `IMAGE_TAG` and `ops/deploy.sh` / `ops/rollback.sh` accept only a full 40-character git SHA.

If the GHCR packages are private, authenticate on the VPS with a token that has `read:packages`:

```bash
docker login ghcr.io
```

Alternatively, make the packages public after the first publication.

## Repository setup on the VPS

```bash
git clone https://github.com/mateusarcedev/devlist.git
cd devlist
cp .env.example .env
```

Edit `.env` and replace every placeholder. `ops/deploy.sh` refuses to run while `POSTGRES_PASSWORD`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET` or `ACME_EMAIL` are empty or placeholders, or while `COOKIE_DOMAIN` is not a bare production host.

Generate URL-safe secrets (the Postgres password is embedded in `DATABASE_URL` / `DIRECT_URL`):

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # JWT_SECRET
```

`COOKIE_DOMAIN=devlist.mateusarce.dev` scopes the access cookie to the Devlist hosts only; do not use `.mateusarce.dev`, which would send it to every other subdomain.

Important production values:

```dotenv
IMAGE_REGISTRY=ghcr.io/mateusarcedev
IMAGE_TAG=<full-git-sha>

POSTGRES_PASSWORD=<strong-secret>
JWT_SECRET=<strong-random-secret>

GITHUB_ID=<production-client-id>
GITHUB_SECRET=<production-client-secret>

API_URL=https://api.devlist.mateusarce.dev
FRONTEND_URL=https://devlist.mateusarce.dev
COOKIE_DOMAIN=devlist.mateusarce.dev

WEB_DOMAIN=devlist.mateusarce.dev
API_DOMAIN=api.devlist.mateusarce.dev
ACME_EMAIL=<real-email>
```

The web image compiles `NEXT_PUBLIC_URL_API` at build time. The publish workflow defaults to `https://api.devlist.mateusarce.dev`. If the API hostname changes, set the repository variable `PRODUCTION_API_URL` before publishing the image.

## First deploy

Use the SHA from the successful **Publish production images** workflow:

```bash
git pull --ff-only
sh ./ops/deploy.sh <full-git-sha>
```

The deploy script:

1. pulls PostgreSQL, Caddy, API, migrator, and web images;
2. starts PostgreSQL and waits for readiness;
3. creates a PostgreSQL backup;
4. applies Prisma migrations;
5. starts API, web, and Caddy;
6. checks `API_URL/health/ready`;
7. checks `FRONTEND_URL`;
8. records the healthy image tag for rollback.

## Normal deploy

After a new `main` commit has published images:

```bash
git pull --ff-only
sh ./ops/deploy.sh <new-full-git-sha>
```

Do not deploy a SHA until the image publishing workflow has completed successfully.

## Backups

Create a manual backup:

```bash
sh ./ops/backup-postgres.sh
```

Default destination:

```text
./backups/devlist-YYYYMMDDTHHMMSSZ.dump
```

Defaults:

- custom PostgreSQL format;
- no owner/privilege metadata;
- retention: 14 days.

Override in `.env`:

```dotenv
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=14
```

### Scheduled backup

```bash
# crontab -e (as the deploy user)
15 3 * * * cd /opt/devlist && sh ./ops/backup-postgres.sh >> /var/log/devlist-backup.log 2>&1
```

### Off-site copy (required)

A local disk backup does not protect against VPS/disk loss. Copy dumps to external storage after each backup, with credentials kept outside the repository (e.g. `~/.config/rclone/rclone.conf`, mode 600):

```bash
# crontab -e, after the backup job
45 3 * * * rclone copy /opt/devlist/backups remote:devlist-backups --include 'devlist-*.dump' >> /var/log/devlist-offsite.log 2>&1
```

Confirm with `rclone ls remote:devlist-backups` that the newest dump is present. Use a bucket/remote with versioning or its own retention policy.

### Restore drill

Test restoring on a disposable Postgres, never on production:

```bash
docker run -d --name restore-test -e POSTGRES_PASSWORD=test postgres:16-alpine
docker cp ./backups/<file>.dump restore-test:/tmp/b.dump
docker exec restore-test pg_restore --no-owner --no-privileges -U postgres -d postgres /tmp/b.dump
docker exec restore-test psql -U postgres -c 'SELECT count(*) FROM tools;'
docker rm -f restore-test
```

## Restore

Database restore is deliberately guarded.

Put the application in a maintenance window and create a fresh backup first.

Then:

```bash
CONFIRM_RESTORE=YES sh ./ops/restore-postgres.sh ./backups/<file>.dump
```

The restore script stops Caddy, web, and API before touching the database and leaves them stopped if the restore finishes or fails. This avoids serving traffic against a partially restored database.

The restore uses `pg_restore --clean --if-exists`, so existing objects can be replaced.

Afterward, deploy an application image tag that is compatible with that backup:

```bash
sh ./ops/deploy.sh <git-sha-or-image-tag>
```

## Application rollback

The deploy script stores the previous healthy image tag under `.deploy/`.

Rollback to the recorded previous tag:

```bash
sh ./ops/rollback.sh
```

Or target a specific published SHA:

```bash
sh ./ops/rollback.sh <full-git-sha>
```

### Migration caveat

Prisma `migrate deploy` is forward-only. Application image rollback does **not** roll database schema backward.

Therefore:

- prefer backward-compatible migrations;
- deploy schema changes before removing compatibility from application code;
- for a destructive/incompatible migration, restoring a pre-deploy backup may be required.

Never automatically restore a database as part of an application rollback.

## Smoke checks

After each deployment:

```bash
curl -fsS https://api.devlist.mateusarce.dev/health/live
curl -fsS https://api.devlist.mateusarce.dev/health/ready
curl -I https://devlist.mateusarce.dev
curl -sI https://api.devlist.mateusarce.dev/auth/github | grep -i '^location: https://github.com/login/oauth'
```

After TLS is confirmed on both hosts, uncomment `Strict-Transport-Security` in `ops/Caddyfile` and redeploy.

Also validate manually:

- Discover loads tools/categories;
- GitHub sign-in redirects to the production callback;
- favorites can be added/removed;
- suggestion modal submits;
- admin mutation succeeds for an ADMIN user;
- non-admin users cannot mutate the catalog.

## Useful operational commands

```bash
docker compose ps
docker compose logs -f caddy
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
```

Restart one service:

```bash
docker compose restart api
```

See the currently recorded deployment tag:

```bash
cat .deploy/current-tag
```

## TLS data

Caddy certificates and state live in named volumes:

- `caddy_data`;
- `caddy_config`.

Do not delete these volumes casually.

## What is not automated yet

This repository publishes immutable images and contains repeatable VPS deploy/rollback scripts.

SSH-based deployment from GitHub Actions is intentionally left for a separate step, after the VPS host/user/key and deployment policy are configured as repository secrets.
