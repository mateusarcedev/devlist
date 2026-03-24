# Tools4.tech

A developer tools discovery platform where you can explore, favorite, and suggest tools for your workflow.

## Features

- Browse and search developer tools organized by category
- Sign in with GitHub to save your favorite tools
- Suggest new tools to the community
- Admin panel for reviewing and approving suggestions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, TanStack React Query |
| Backend | NestJS 10, Prisma ORM |
| Database | PostgreSQL |
| Auth | NextAuth v4 (GitHub OAuth) |

## Project Structure

```
tools4.tech/
├── api/   # NestJS REST API
└── web/   # Next.js frontend
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (frontend)
- npm (backend)
- Docker (for local PostgreSQL)

### 1. Start the database

```bash
cd api
docker-compose up -d
```

### 2. Set up the API

```bash
cd api
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET
npx prisma migrate dev
npm run dev            # runs on http://localhost:3001
```

API environment variables:

```env
DATABASE_URL=postgresql://arce:arce@localhost:5432/devlinks
DIRECT_URL=postgresql://arce:arce@localhost:5432/devlinks
NEXTAUTH_SECRET=your-secret-here
PORT=3001
```

### 3. Set up the frontend

```bash
cd web
pnpm install
cp .env.example .env.local   # fill in GitHub OAuth credentials and secrets
pnpm dev                     # runs on http://localhost:3000
```

Frontend environment variables (see `web/.env.example`):

```env
URL_API=http://localhost:3001
NEXT_PUBLIC_URL_API=http://localhost:3001
GITHUB_ID=your-github-app-id
GITHUB_SECRET=your-github-app-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GITHUB_TOKEN=              # optional, for contributor stats
```

> To get `GITHUB_ID` and `GITHUB_SECRET`, create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers) with callback URL `http://localhost:3000/api/auth/callback/github`.

## API Documentation

Swagger UI is available at `http://localhost:3001/api` when the API is running.

## Contributing

1. Fork the repository and create a new branch for your change.
2. Make sure your code follows the existing style and all tests pass (`npm run test` in `/api`).
3. Open a pull request describing what you changed and why.
4. A maintainer will review your PR and may request changes.

Contributors are recognized in `CONTRIBUTORS.md`.
