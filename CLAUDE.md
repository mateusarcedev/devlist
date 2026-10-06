# CLAUDE.md

This file provides repository-specific guidance for coding agents working on **Devlist**.

## Project overview

Devlist is a full-stack monorepo for a community-driven developer tools catalog with GitHub OAuth, favorites, suggestions, and admin-managed tools/categories.

- `apps/api` — NestJS 12, Prisma 7, PostgreSQL 16
- `apps/web` — Next.js 16, React 19, Tailwind CSS 4, TanStack Query
- package manager — pnpm 12
- runtime — Node.js 24
- orchestration — Turborepo + Docker Compose

The repository is named `devlist` for historical reasons. Public product branding is **Devlist**.

## Commands

Run commands from the repository root unless noted otherwise.

### Monorepo

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm lint
```

### API

```bash
pnpm --filter @devlist/api dev
pnpm --filter @devlist/api build
pnpm --filter @devlist/api lint
pnpm --filter @devlist/api test --runInBand
pnpm --filter @devlist/api test:e2e
pnpm --filter @devlist/api test:cov
pnpm --filter @devlist/api seed:demo
```

### Web

```bash
pnpm --filter @devlist/web dev
pnpm --filter @devlist/web build
pnpm --filter @devlist/web lint
pnpm --filter @devlist/web test
pnpm --filter @devlist/web test:watch
pnpm --filter @devlist/web typecheck
```

### Local PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d postgres
pnpm --filter @devlist/api exec prisma migrate deploy
```

## Architecture

### Authentication

1. The user starts GitHub OAuth at `/auth/github` on the NestJS API.
2. `passport-github2` handles `/auth/callback/github`.
3. The API upserts the GitHub user.
4. The API issues a signed access JWT and rotating refresh token.
5. In production, web and API use sibling HTTPS hosts.
6. `access_token` is HTTP-only and may use `Domain=COOKIE_DOMAIN` so frontend SSR can read it.
7. `refresh_token` stays host-only on the API and is scoped to `/auth`.
8. `AuthenticatedUserGuard` validates identity.
9. `AdminGuard` checks the current user role from PostgreSQL before catalog mutations.

Do not reintroduce NextAuth; the current auth flow is owned by the NestJS API.

### API

Feature modules follow Controller → Service → PrismaService.

Key modules:

- tools
- categories
- users
- favorites
- suggestions
- auth
- health
- prisma

Public reads for tools/categories remain public. Catalog writes require ADMIN authorization.

Swagger: `http://localhost:3001/api`

Health:

- `GET /health/live`
- `GET /health/ready`

### Web

- App Router
- Server Components by default
- client components only where interaction is required
- TanStack Query for client-side server state
- Axios for browser API calls
- HTTP-only auth cookie; no JavaScript-readable access token
- Vitest + Testing Library for frontend tests

## Environment

Canonical production contract: root `.env.example`.

Local API:

```dotenv
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://devlist:devlist@localhost:5432/devlist?schema=public
DIRECT_URL=postgresql://devlist:devlist@localhost:5432/devlist?schema=public
JWT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

Local web:

```dotenv
URL_API=http://localhost:3001
NEXT_PUBLIC_URL_API=http://localhost:3001
JWT_SECRET=
GITHUB_TOKEN=
```

`JWT_SECRET` must match between API and web.

## CI expectations

Every PR to `main` must preserve the Quality Gate:

- PostgreSQL migrations
- API lint/build/unit/E2E
- web lint/tests/typecheck/build

Do not weaken a failing gate to make a PR pass; fix the underlying issue.

## Data model

- `Tool`
- `Category`
- `User` with `USER | ADMIN`
- `Favorite`
- `Suggestion`
- persisted refresh tokens

## Production assumptions

Production URLs must be HTTPS sibling hosts covered by `COOKIE_DOMAIN`, for example:

- `https://devlist.mateusarce.dev`
- `https://api.devlist.mateusarce.dev`

The Docker stack is intended to run behind a reverse proxy/TLS terminator.
