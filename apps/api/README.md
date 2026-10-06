# Devlist API

NestJS API for the Devlist developer-tools catalog.

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
pnpm --filter @devlist/api exec prisma migrate deploy
pnpm --filter @devlist/api dev
```

API: `http://localhost:3001`

Swagger: `http://localhost:3001/api`

## Quality checks

```bash
pnpm --filter @devlist/api lint
pnpm --filter @devlist/api build
pnpm --filter @devlist/api test --runInBand
pnpm --filter @devlist/api test:e2e
```

## Health

- `GET /health/live`
- `GET /health/ready`

## Authorization

Public catalog reads remain unauthenticated.

Tool/category mutations require:

1. a valid authenticated user;
2. the current `ADMIN` role stored in PostgreSQL.
