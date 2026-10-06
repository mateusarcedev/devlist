# Tools4.tech API

NestJS API for the Tools4.tech developer-tools catalog.

For full project setup, architecture, and production notes, see the [root README](../../README.md).

## Stack

- NestJS 12
- Prisma 7
- PostgreSQL 16
- GitHub OAuth
- JWT access tokens + rotating refresh tokens
- Jest + Supertest

## Local development

From the repository root:

```bash
pnpm install --frozen-lockfile
docker compose -f docker-compose.dev.yml up -d postgres
cp apps/api/.env.example apps/api/.env
pnpm --filter @tools4tech/api exec prisma migrate deploy
pnpm --filter @tools4tech/api dev
```

API: `http://localhost:3001`

Swagger: `http://localhost:3001/api`

## Quality checks

```bash
pnpm --filter @tools4tech/api lint
pnpm --filter @tools4tech/api build
pnpm --filter @tools4tech/api test --runInBand
pnpm --filter @tools4tech/api test:e2e
```

## Health

- `GET /health/live`
- `GET /health/ready`

## Authorization

Public catalog reads remain unauthenticated.

Tool/category mutations require:

1. a valid authenticated user;
2. the current `ADMIN` role stored in PostgreSQL.
