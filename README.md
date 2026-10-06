# Tools4.tech

> A community-driven catalog for discovering, saving, and suggesting useful developer tools.

[![CI](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml/badge.svg)](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Node](https://img.shields.io/badge/Node.js-24-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-black)

[Português (Brasil)](./README.pt-BR.md)

## What is Tools4.tech?

**Tools4.tech** is an open-source directory for developer tools.

Instead of relying on scattered bookmarks, social posts, or private lists, developers can browse a curated catalog, filter by category, save favorites, suggest new tools, and contribute back to the project.

> The repository keeps the historical name `devlist`, but the product name is **Tools4.tech**.

## Product tour

| Area | What it does |
| --- | --- |
| Discover | Browse and search the full catalog, filter by category, and open tool pages |
| Categories | Explore focused directories for each category |
| Favorites | Save tools to a personal list after GitHub sign-in |
| Suggest a tool | Send a tool suggestion through the authenticated community flow |
| Contributors | Explore the people contributing to the repository |
| Admin | Create catalog entries through an API-protected admin flow |

The current interface uses a compact dark developer-focused design with accessible navigation, responsive layouts, global loading/error states, keyboard support, and reduced-motion handling.

## Core features

- Public catalog organized by category
- Search and category filters
- GitHub OAuth authentication
- HTTP-only access and refresh token flow
- Personal favorites
- Community tool suggestions
- Contributors directory backed by GitHub data
- Admin-only catalog mutations enforced by the API
- PostgreSQL migrations and demo seed
- Health/readiness endpoints for production orchestration
- Permanent CI quality gate
- Responsive and accessible frontend states
- Open Graph / social sharing metadata

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

For the local GitHub OAuth App:

```text
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3001/auth/callback/github
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

## Tests and quality gate

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

Every pull request to `main` is validated by the GitHub Actions **Quality Gate**, including PostgreSQL migrations, API tests/E2E, frontend tests, lint, type checking, and production builds.

## Production topology

The production Docker Compose stack includes PostgreSQL, a migration job, an optional demo seed profile, the API with readiness health checks, and the web app gated on API health.

The production auth topology uses sibling HTTPS hosts under the same parent domain:

```text
https://www.tools4.tech
https://api.tools4.tech
```

The stack is prepared to run behind a reverse proxy / TLS terminator. See [`.env.example`](./.env.example) for the complete production environment contract.

The application is currently in the **pre-production deployment phase**. VPS provisioning, reverse proxy, DNS, TLS, OAuth production configuration, backups, rollback, and operational documentation are the final delivery steps.

## Open source

Tools4.tech is released under the [MIT License](./LICENSE).

Useful project documents:

- [Contributing guide](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Contributors](./CONTRIBUTORS.md)

## Project status

The application baseline and frontend redesign are complete.

Completed areas include framework modernization, PostgreSQL, migrations, environment validation, authentication hardening, API authorization, health checks, backend E2E, frontend tests, CI, responsive UI, accessibility states, and open-source project documentation.

The remaining work is focused on production deployment and post-deploy screenshots/operational verification.
