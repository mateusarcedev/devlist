# syntax=docker/dockerfile:1.7

FROM node:24.21.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS migrator
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma7.config.ts ./apps/api/prisma7.config.ts
WORKDIR /app/apps/api

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM migrator AS seeder
RUN pnpm exec prisma generate

CMD ["pnpm", "exec", "prisma", "db", "seed"]

FROM deps AS builder
COPY apps/api ./apps/api
RUN pnpm --filter @tools4tech/api exec prisma generate
RUN pnpm --filter @tools4tech/api build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --prod --filter @tools4tech/api... --ignore-scripts

FROM node:24.21.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
