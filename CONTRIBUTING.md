# Contributing to Devlist

Thanks for helping improve **Devlist**. Contributions are welcome across the catalog, frontend, API, tests, documentation, and developer experience.

## Before you start

For small fixes, feel free to open a pull request directly.

For larger behavior changes, architecture changes, or new product features, open an issue first so the implementation can be discussed before significant work is done.

## Development setup

Requirements:

- Node.js 24.21+
- pnpm 12.9.1
- Docker with Docker Compose
- PostgreSQL 16 (the development compose file provides it)

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Start PostgreSQL:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

Configure the applications:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Apply migrations:

```bash
pnpm --filter @devlist/api exec prisma migrate deploy
```

Start the monorepo:

```bash
pnpm dev
```

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep the change focused on one problem or feature.
3. Add or update tests for behavior changes.
4. Run the relevant checks locally.
5. Open a pull request with a concise explanation of what changed and why.

Recommended branch prefixes:

- `feat/`
- `fix/`
- `docs/`
- `test/`
- `chore/`

## Quality gate

The CI pipeline validates PostgreSQL migrations plus API and web quality checks.

Before opening a pull request, run the checks related to your change:

```bash
# API
pnpm --filter @devlist/api lint
pnpm --filter @devlist/api build
pnpm --filter @devlist/api test --runInBand
pnpm --filter @devlist/api test:e2e

# Web
pnpm --filter @devlist/web lint
pnpm --filter @devlist/web test
pnpm --filter @devlist/web typecheck
pnpm --filter @devlist/web build
```

## Catalog contributions

The public product includes an in-app **Suggest a tool** flow. Use it for catalog suggestions that do not require code changes.

Use a pull request when the contribution changes product behavior, application code, tests, documentation, infrastructure, or developer tooling.

## Style

- Follow the existing TypeScript and React conventions.
- Prefer small, composable changes.
- Keep API authorization rules server-side.
- Do not commit secrets, access tokens, local databases, or generated environment files.
- Keep user-facing copy consistent with the current English product UI.

## Security issues

Please do not publish exploitable security issues in a public GitHub issue. Follow [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the repository's [MIT License](./LICENSE).
