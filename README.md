# Tools4.tech

> A community-driven catalog for discovering, saving, and suggesting useful developer tools.

[Português (Brasil)](./README.pt-BR.md)

## About

**Tools4.tech** helps developers find useful tools without relying on scattered social posts, bookmarks, and personal lists.

The platform combines a public, category-based catalog with GitHub authentication, favorites, community suggestions, and an admin workflow for maintaining the catalog.

> Repository name: `devlist` is kept for project history. The product name is **Tools4.tech**.

## Features

- Browse developer tools by category
- Open tool links with a `tools4.tech` referral marker
- Sign in with GitHub OAuth
- Save and remove favorites
- Suggest tools for review
- View project contributors and repository statistics
- Admin-only tool and category mutations enforced by the API
- Health/readiness endpoints for production orchestration
- Demo seed for local/staging environments

## Architecture

```text
Browser
  │
  ▼
Next.js 16 / React 19
  │  HTTPS + HTTP-only access cookie
  ▼
NestJS 12 API
  │
  ├── GitHub OAuth
  ├── JWT + rotating refresh tokens
  └── Prisma 7
        │
        ▼
    PostgreSQL 16
```

This repository is a **pnpm monorepo** managed with Turborepo:

```text
devlist/
├── apps/
│   ├── api/       # NestJS API
│   └── web/       # Next.js app
├── .github/
│   └── workflows/ # CI quality gate
├── docker-compose.dev.yml
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Tech stack

| Area | Technology |
| --- | --- |
| Web | Next.js 16, React 19, Tailwind CSS 4, TanStack Query |
| API | NestJS 12, Express 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Auth | GitHub OAuth, signed JWT access tokens, rotating refresh tokens |
| Tests | Jest/Supertest (API), Vitest/Testing Library (web) |
| Monorepo | pnpm 12, Turborepo 2 |
| Runtime | Node.js 24 |
| Delivery | Docker, Docker Compose, GitHub Actions |

## Local development

### Requirements

- Node.js **24.21+**
- pnpm **12.9.1**
- Docker with Docker Compose
- A GitHub OAuth App for sign-in flows

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

The development database runs on `localhost:5432` with the same defaults used by the API example environment.

### 3. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in at least:

```dotenv
GITHUB_ID=your-github-oauth-client-id
GITHUB_SECRET=your-github-oauth-client-secret
JWT_SECRET=replace-with-a-local-secret
```

For the local GitHub OAuth App, use:

```text
Homepage URL:        http://localhost:3000
Authorization callback URL:
http://localhost:3001/auth/callback/github
```

### 4. Configure the web app

```bash
cp apps/web/.env.example apps/web/.env.local
```

Use the **same `JWT_SECRET`** configured for the API.

### 5. Apply migrations

```bash
pnpm --filter @tools4tech/api exec prisma migrate deploy
```

Optional demo data:

```bash
pnpm --filter @tools4tech/api seed:demo
```

### 6. Run the monorepo

```bash
pnpm dev
```

Local services:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`
- Liveness: `http://localhost:3001/health/live`
- Readiness: `http://localhost:3001/health/ready`

## Tests and quality gates

Run the main checks locally:

```bash
# API
pnpm --filter @tools4tech/api lint
pnpm --filter @tools4tech/api build
pnpm --filter @tools4tech/api test --runInBand
pnpm --filter @tools4tech/api test:e2e

# Web
pnpm --filter @tools4tech/web lint
pnpm --filter @tools4tech/web test
pnpm --filter @tools4tech/web typecheck
pnpm --filter @tools4tech/web build
```

Every pull request to `main` is validated by the GitHub Actions **Quality Gate**, including PostgreSQL migrations, API tests/E2E, frontend tests, lint, type checking, and builds.

## Production

The production Docker Compose stack includes:

- PostgreSQL
- migration job
- optional demo seed profile
- API with readiness health check
- web app gated on API health

Production authentication expects the web and API to use sibling HTTPS hosts under the same parent domain, for example:

```text
https://www.tools4.tech
https://api.tools4.tech
```

The stack is intended to run behind a reverse proxy/TLS terminator. See [`.env.example`](./.env.example) for the complete production environment contract.

**Production deployment is intentionally not documented as live yet.** VPS, reverse proxy, DNS, backup, and rollback are handled in the final deployment phase.

## Contributing

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Run the relevant quality checks
5. Open a pull request explaining what changed and why

See [CONTRIBUTORS.md](./CONTRIBUTORS.md) for project contributors.

## Project status

The modernization baseline is complete: current framework versions, PostgreSQL, migrations, production environment validation, auth hardening, health checks, API E2E, frontend tests, and permanent CI are in place.

The remaining delivery work is focused on final visual assets and production deployment/operations.

## License

No license has been published for this repository yet. The source is publicly visible, but reuse and redistribution rights have not been granted through an open-source license.
