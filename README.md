# Devlist

> Discover the tools developers actually use — found and organized by the community.

[🇧🇷 Português](./README.pt-BR.md)

---

## Why devlist exists

Finding good development tools is harder than it should be.
Recommendations are scattered across Twitter threads, newsletters, random lists,
and Slack conversations — with no context, no curation, no way to know if anyone actually uses them.

devlist centralizes all of that. An open source platform where the community discovers,
favorites, and suggests tools — so you can see what real developers are actually using.

---

## What you can do

- **Explore** tools organized by category
- **Favorite** the ones that fit your workflow (sign in with GitHub)
- **Suggest** new tools for the community to review

---

## Preview

> 🚧 Coming soon — [devlist.mateusarce.dev](https://devlist.mateusarce.dev)

<!-- Add screenshot here when the deployment is live -->

---

## Running locally

> For contributors who want to run the project on their own machine.

### Prerequisites

- Node.js 20+
- pnpm (frontend) / npm (backend)
- Docker

### 1. Database

```bash
cd api && docker-compose up -d
```

### 2. API

```bash
cd api
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev  # http://localhost:3001
```

### 3. Frontend

```bash
cd web
pnpm install
cp .env.example .env.local
pnpm dev  # http://localhost:3000
```

> Swagger available at `http://localhost:3001/api`

---

## Contributing

1. Fork the repository and create a new branch for your change
2. Make sure the tests pass: `npm run test` in `/api`
3. Open a PR describing what changed and why

Contributors are recognized in [`CONTRIBUTORS.md`](./CONTRIBUTORS.md).

---

## Tech Stack

| Layer    | Technology                                               |
|----------|----------------------------------------------------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, TanStack Query     |
| Backend  | NestJS 10, Prisma ORM                                    |
| Database | PostgreSQL                                               |
| Auth     | NextAuth v4 (GitHub OAuth)                               |
