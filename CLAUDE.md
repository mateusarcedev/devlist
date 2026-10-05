# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tools4.tech is a full-stack monorepo for a developer tools discovery platform with GitHub OAuth, user favorites, and community tool suggestions.

- **`apps/api`** — NestJS 12 backend (TypeScript, Prisma 7 + PostgreSQL)
- **`apps/web`** — Next.js 16 frontend (React 19, TanStack Query)

## Commands

### API (backend)

```bash
cd api
npm install
npm run dev          # dev server with watch mode
npm run build
npm run start:prod
npm run test         # unit tests (Jest)
npm run test:watch
npm run test:cov
npm run test:e2e
npm run lint
npm run format
```

Run a single test file:
```bash
cd api && npx jest src/favorites/favorites.controller.spec.ts
```

### Web (frontend)

```bash
cd web
pnpm install
pnpm dev             # Next.js with Turbo
pnpm build
pnpm lint
```

### Database

```bash
# From repo root — starts postgres, api, and web (requires Infisical)
infisical run -- docker compose up -d

# Migrations (run from api/ with production DATABASE_URL in Infisical)
cd api && infisical run -- npx prisma migrate deploy

# Visual DB explorer (requires DATABASE_URL in local .env)
cd api && npx prisma studio
```

## Architecture

### Authentication Flow

1. User starts GitHub OAuth through the Nest API at `/auth/github`
2. `passport-github2` handles the callback at `/auth/callback/github`
3. The API upserts the GitHub user and issues an access JWT plus a rotating refresh token
4. In production, frontend and API use sibling hosts (for example `yourdomain.com` and `api.yourdomain.com`)
5. The API sets `access_token` as HTTP-only with `Domain=COOKIE_DOMAIN`, `Secure`, and `SameSite=Lax`, so frontend SSR can read the session while JavaScript cannot
6. The `refresh_token` stays host-only on the API and is scoped to `/auth`, so it is available to refresh and logout but is never shared with the frontend host
7. `AuthenticatedUserGuard` validates access JWTs using the single canonical `JWT_SECRET`
8. Refresh token hashes are persisted in PostgreSQL and rotated by `/auth/refresh`

### API Module Structure

NestJS follows a strict layered pattern: **Controller → Service → PrismaService**. Each feature module lives in its own directory under `/api/src/`:

| Module | Key notes |
|--------|-----------|
| `tools` | CRUD + filter by category |
| `categories` | Basic CRUD |
| `users` | Upsert on GitHub login (githubId is PK) |
| `favorites` | Toggle endpoint with atomic/concurrency-safe execution |
| `suggestions` | User-submitted tools; statuses: PENDING / APPROVED / REJECTED |
| `prisma` | Shared `PrismaService` injected into all modules |

Global rate limiting: 10 requests per 60 seconds (`@nestjs/throttler`).
Swagger UI: `http://localhost:3001/api`

### Frontend Architecture

- **App Router** with Server Components by default; interactive parts use `"use client"`
- **TanStack React Query** manages all server state (tools, favorites, suggestions)
- **Axios** instance configured in `/web/src/utils/` with base URL and auth headers
- **NextAuth session** provides user identity; middleware protects auth-required routes
- Categories are static JSON (`/web/src/data/categories.json`)

## Environment Variables

The canonical Docker Compose contract is documented in the root `.env.example`.

**API local development (`apps/api/.env`):**
```
NODE_ENV=development
PORT=3001
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
# COOKIE_DOMAIN is intentionally unset on localhost
```

**Web local development (`apps/web/.env.local`):**
```
URL_API=http://localhost:3001
NEXT_PUBLIC_URL_API=http://localhost:3001
JWT_SECRET=          # must exactly match the API JWT_SECRET
GITHUB_TOKEN=        # optional, for contributor stats
```

Production startup validates the API environment before Nest initializes. `JWT_SECRET`, GitHub OAuth credentials, database URL, public API/frontend URLs, and `COOKIE_DOMAIN` are required. Production `API_URL` and `FRONTEND_URL` must use HTTPS and must be distinct sibling hosts covered by `COOKIE_DOMAIN`.

## Data Model (Prisma)

- `Tool` — name, link (unique), description, categoryId
- `Category` — name (unique)
- `User` — githubId (PK), name, email, avatar, role (USER/ADMIN)
- `Favorite` — userId + toolId (composite unique)
- `Suggestion` — links a user to a proposed tool, with status lifecycle
