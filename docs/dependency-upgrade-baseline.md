# Dependency upgrade baseline

This document records the repository state **before** the dependency modernization work.

Baseline commit: `7fc2c9c89c7f2584f5114da53b973850a2bd22dc`

The purpose of this baseline is to distinguish regressions introduced by dependency upgrades from problems that already exist on `main`.

## Scope

No application behavior, dependency version, Docker configuration, migration, authentication flow, CI workflow, or runtime code is changed by this baseline.

The modernization work will be performed in independent pull requests after this one is merged.

## Repository structure

The project is a pnpm/Turborepo monorepo:

```text
devlist/
├── apps/
│   ├── api/
│   └── web/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
└── docker-compose.dev.yml
```

`pnpm-workspace.yaml` declares:

```yaml
packages:
  - "apps/*"
```

Therefore the effective application paths are:

- API: `apps/api`
- Web: `apps/web`

The root README still references the old `cd api` and `cd web` paths. That inconsistency predates the dependency upgrade work.

## Current framework versions

### Web

From `apps/web/package.json`:

- Next.js: `15.1.6`
- React: `19.0.0`
- React DOM: `19.0.0`
- Tailwind CSS: `^4.0.0`
- @tailwindcss/postcss: `^4.0.3`
- TypeScript: `5.7.3`
- ESLint: `^8.57.1`
- eslint-config-next: `^16.2.1`
- TanStack Query: `^5.66.0`
- Axios: `^1.7.9`
- Zod: `^3.24.1`

### API

From `apps/api/package.json`:

- NestJS common/core/platform-express: `^10.0.0`
- NestJS CLI/testing/schematics: `^10.0.0`
- Prisma / @prisma/client: `^6.1.0`
- TypeScript: `^5.1.3`
- Jest: `^29.5.0`
- ESLint: `^8.42.0`
- RxJS: `^7.8.1`

### Monorepo root

From the root `package.json`:

- Node engine: `>=20`
- pnpm: `9.12.3`
- Turborepo: `latest`

## Existing test coverage

The API contains unit/spec coverage across the main modules, including:

- app
- auth
- categories
- favorites
- suggestions
- tools
- users
- Prisma service
- authenticated user guard
- global exception filter

There are 16 `*.spec.ts` files in the API source tree.

The web package currently has no test script.

## Known pre-existing issues

These issues were identified on `main` before any dependency upgrade.

### 1. API E2E test is stale

`apps/api/test/app.e2e-spec.ts` imports:

```ts
import { AppModule } from './../src/app.module';
```

The current module is located at:

```text
apps/api/src/app/app.module.ts
```

The E2E test also expects:

```text
GET / -> "Hello World!"
```

but the current `AppController` no longer defines that endpoint.

This must not be treated as a regression caused by NestJS upgrades.

### 2. README paths are stale

The main README and Portuguese README still instruct contributors to use:

```bash
cd api
cd web
```

The real paths are `apps/api` and `apps/web`.

### 3. Authentication documentation is stale

The README/CLAUDE documentation references NextAuth v4, but the current runtime flow is implemented by the API using:

- `passport-github2`
- NestJS auth endpoints
- access/refresh JWTs
- HTTP-only cookies

The web package does not declare `next-auth` as a dependency.

### 4. Environment examples are inconsistent

The root, API, and web `.env.example` files do not describe one consistent environment contract.

For example, the API implementation uses variables including:

- `JWT_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `API_URL`
- `FRONTEND_URL`

while `apps/api/.env.example` still documents `NEXTAUTH_SECRET` and omits several variables required by the current OAuth implementation.

### 5. Docker build contexts are inconsistent with the monorepo

The root Compose file builds the API with `./apps/api` as context, while the API Dockerfile runs `npm ci` without a package lock in that directory.

The web service uses `./apps/web` as context, while its Dockerfile expects `pnpm-lock.yaml`, which lives at the repository root.

These Docker problems predate the dependency modernization.

### 6. Prisma schema and migration history are not fully aligned

The Prisma schema currently contains the `RefreshToken` model mapped to `refresh_tokens`.

No versioned migration creating the `refresh_tokens` table was found in the current migration history.

This must be addressed separately from the Prisma dependency upgrade.

### 7. API healthcheck is absent

PostgreSQL has a Compose healthcheck, but the API does not expose a dedicated health/readiness endpoint and the web container does not wait for API readiness.

### 8. CI is absent

There is currently no `.github/workflows` directory on `main`, and the baseline commit has no CI status checks.

### 9. Branding is inconsistent

Public/internal references currently mix:

- `devlist`
- `Tools4.tech`
- `DevLinks`

This cleanup is intentionally outside the dependency upgrade phase.

## Baseline commands

The following commands are the intended verification gates for dependency upgrade PRs:

```bash
pnpm install --frozen-lockfile

pnpm build
pnpm lint

pnpm --filter @tools4tech/api test
pnpm --filter @tools4tech/api test:cov
pnpm --filter @tools4tech/api test:e2e

pnpm --filter @tools4tech/web build
pnpm --filter @tools4tech/web lint
```

Because the current E2E test is already stale, `test:e2e` is expected to require repair in a later dedicated step.

## Upgrade sequence

Dependency modernization should proceed in small, independently reviewable pull requests:

1. Runtime/package-manager baseline: Node, pnpm and Turborepo.
2. Next.js + React + frontend ESLint migration.
3. Tailwind and remaining frontend dependencies.
4. NestJS upgrade.
5. Prisma and remaining backend dependencies.
6. Test/tooling dependencies.

Only after the framework/dependency stack is stable should the project move on to:

1. Docker monorepo fixes.
2. Prisma migration repair and demo seed.
3. Environment contract, OAuth/cookies and healthcheck.
4. E2E and CI.
5. Branding, README and screenshots.
6. VPS deployment.

## Regression rule

During the upgrade sequence:

- a behavior documented above as already broken is a **pre-existing issue**;
- any new failure introduced after a dependency bump is a **regression** and should be fixed within that upgrade PR before merge;
- unrelated architectural cleanup should not be bundled into framework upgrade PRs unless the new version strictly requires it.
