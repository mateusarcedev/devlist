# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tools4.tech is a full-stack monorepo for a developer tools discovery platform with GitHub OAuth, user favorites, and community tool suggestions.

- **`/api`** — NestJS 10 backend (TypeScript, Prisma + PostgreSQL)
- **`/web`** — Next.js 15 frontend (React 19, TanStack Query, NextAuth v4)

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

1. User signs in via GitHub OAuth (NextAuth v4 in `/web/src/app/api/auth`)
2. `signIn` callback POSTs to `/users` to create/sync user in the DB
3. NextAuth issues a JWT containing `githubId` and `avatar_url`
4. Frontend sends `Authorization: Bearer <token>` on requests to protected endpoints
5. Backend `AuthenticatedUserGuard` (`/api/src/common/guards/`) validates the JWT using `NEXTAUTH_SECRET`

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

**API (`/api/.env`):**
```
DATABASE_URL=
DIRECT_URL=          # used for Prisma migrations
NEXTAUTH_SECRET=     # must match the frontend secret
PORT=3001
```

**Web (`/web/.env.local`):**
```
URL_API=http://localhost:3001
NEXT_PUBLIC_URL_API=http://localhost:3001
GITHUB_ID=
GITHUB_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GITHUB_TOKEN=        # optional, for contributor stats
```

## Data Model (Prisma)

- `Tool` — name, link (unique), description, categoryId
- `Category` — name (unique)
- `User` — githubId (PK), name, email, avatar, role (USER/ADMIN)
- `Favorite` — userId + toolId (composite unique)
- `Suggestion` — links a user to a proposed tool, with status lifecycle
