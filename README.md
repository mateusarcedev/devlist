# DevHub

> A community-curated catalog for discovering, saving, and suggesting developer tools.

[![CI](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml/badge.svg)](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

[Português (Brasil)](./README.pt-BR.md)

**Planned site:** https://devhub.mateusarce.dev

The GitHub repository remains `mateusarcedev/devlist` to preserve history and technical integrations. **DevHub** is the product's public name.

## Features

DevHub helps developers discover and search curated tools, browse categories, save favorites, suggest new tools for moderation, and view project contributors. GitHub sign-in controls user-specific capabilities, and administrators can maintain the catalog. The frontend supports English and Portuguese, light/dark themes, and responsive layouts.

## Target architecture

```text
Browser
   |
   v
Next.js 16 / React 19 (Vercel)
   |                           |
   |                           +-- GitHub contributor data (server-side)
   v
Supabase Auth (GitHub OAuth) + Data API / RLS
   |
   v
Supabase PostgreSQL
```

| Area | Technology |
| --- | --- |
| Web | Next.js 16, React 19, Tailwind CSS 4, TanStack Query |
| Backend | Supabase Auth, Data API, PostgreSQL, Row Level Security |
| Monorepo | pnpm / Turborepo |
| Frontend tests | Vitest / Testing Library |
| Hosting | Vercel (web), Supabase (database and auth) |

The legacy `apps/api` NestJS/Prisma service, Docker Compose, Caddy and operations scripts remain in the repository for reference and rollback while the migration is completed. They are **not** part of the target hosting architecture.

## Local development

Requirements: Node.js 24.21+ and pnpm 12.9.1.

```bash
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
# Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
pnpm --filter @devlist/web dev
```

Configure a Supabase project, enable GitHub OAuth, apply the SQL schema in `supabase/migrations`, and register `http://localhost:3000/auth/callback` as an allowed redirect. The OAuth provider itself uses `https://<project-ref>.supabase.co/auth/v1/callback`.

Migration, data ownership and security setup: [Supabase + Vercel migration guide](./docs/migration-supabase-vercel.md).

## Quality checks

```bash
pnpm --filter @devlist/web lint
pnpm --filter @devlist/web test
pnpm --filter @devlist/web typecheck
pnpm --filter @devlist/web build
```

The existing GitHub Actions quality gate also validates the old API until it is removed.

## Vercel deployment

Import this repository into a Vercel Next.js project using **Root Directory: `apps/web`**. Configure the following variables for production:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
NEXT_PUBLIC_SITE_URL=https://devhub.mateusarce.dev
```

Set the canonical domain to `devhub.mateusarce.dev` and allow `https://devhub.mateusarce.dev/auth/callback` as a Supabase Auth redirect. Verify production DNS and RLS ownership rules before cutover.

**Status:** The Supabase integration code has been merged, but a real Supabase project, data migration and Vercel production deployment must be tested before calling the service live. The old VPS guide is [kept as legacy documentation](./docs/deployment.md).

## Open source

DevHub is available under the [MIT License](./LICENSE). See [Contributing](./CONTRIBUTING.md), [Security](./SECURITY.md) and [Contributors](./CONTRIBUTORS.md).
