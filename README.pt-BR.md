# Tools4.tech

> Um catálogo mantido pela comunidade para descobrir, salvar e sugerir ferramentas úteis para desenvolvedores.

[English](./README.md)

## Sobre

O **Tools4.tech** ajuda desenvolvedores a encontrar ferramentas úteis sem depender de posts espalhados em redes sociais, favoritos do navegador e listas pessoais.

A plataforma combina um catálogo público organizado por categorias com autenticação pelo GitHub, favoritos, sugestões da comunidade e um fluxo administrativo para manutenção do catálogo.

> Nome do repositório: `devlist` é mantido por histórico do projeto. O nome do produto é **Tools4.tech**.

## Funcionalidades

- Explorar ferramentas por categoria
- Abrir ferramentas com marcador de referência `tools4.tech`
- Entrar com GitHub OAuth
- Adicionar e remover favoritos
- Sugerir novas ferramentas para avaliação
- Ver contribuidores e estatísticas do projeto
- Operações administrativas de ferramentas e categorias protegidas pela API
- Endpoints de health/readiness para produção
- Seed de demonstração para ambientes locais/staging

## Arquitetura

```text
Navegador
  │
  ▼
Next.js 16 / React 19
  │  HTTPS + cookie HTTP-only
  ▼
API NestJS 12
  │
  ├── GitHub OAuth
  ├── JWT + refresh tokens rotativos
  └── Prisma 7
        │
        ▼
    PostgreSQL 16
```

Este repositório é um **monorepo pnpm** gerenciado com Turborepo:

```text
devlist/
├── apps/
│   ├── api/       # API NestJS
│   └── web/       # aplicação Next.js
├── .github/
│   └── workflows/ # Quality Gate do CI
├── docker-compose.dev.yml
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Stack

| Área | Tecnologia |
| --- | --- |
| Web | Next.js 16, React 19, Tailwind CSS 4, TanStack Query |
| API | NestJS 12, Express 5 |
| ORM | Prisma 7 |
| Banco | PostgreSQL 16 |
| Auth | GitHub OAuth, access token JWT assinado, refresh tokens rotativos |
| Testes | Jest/Supertest (API), Vitest/Testing Library (web) |
| Monorepo | pnpm 12, Turborepo 2 |
| Runtime | Node.js 24 |
| Entrega | Docker, Docker Compose, GitHub Actions |

## Desenvolvimento local

### Requisitos

- Node.js **24.21+**
- pnpm **12.9.1**
- Docker com Docker Compose
- Um GitHub OAuth App para testar login

### 1. Instale as dependências

```bash
pnpm install --frozen-lockfile
```

### 2. Suba o PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

O banco de desenvolvimento fica em `localhost:5432` e usa os mesmos valores padrão do exemplo de ambiente da API.

### 3. Configure a API

```bash
cp apps/api/.env.example apps/api/.env
```

Preencha pelo menos:

```dotenv
GITHUB_ID=seu-client-id-do-github
GITHUB_SECRET=seu-client-secret-do-github
JWT_SECRET=troque-por-um-segredo-local
```

No GitHub OAuth App local, use:

```text
Homepage URL:        http://localhost:3000
Authorization callback URL:
http://localhost:3001/auth/callback/github
```

### 4. Configure o web

```bash
cp apps/web/.env.example apps/web/.env.local
```

Use o **mesmo `JWT_SECRET`** configurado na API.

### 5. Aplique as migrations

```bash
pnpm --filter @tools4tech/api exec prisma migrate deploy
```

Dados de demonstração opcionais:

```bash
pnpm --filter @tools4tech/api seed:demo
```

### 6. Rode o monorepo

```bash
pnpm dev
```

Serviços locais:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`
- Liveness: `http://localhost:3001/health/live`
- Readiness: `http://localhost:3001/health/ready`

## Testes e Quality Gate

Execute localmente:

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

Toda pull request para `main` passa pelo **Quality Gate** do GitHub Actions, incluindo migrations PostgreSQL, testes/E2E da API, testes do frontend, lint, typecheck e builds.

## Produção

O Docker Compose de produção inclui:

- PostgreSQL
- job de migrations
- perfil opcional para seed demo
- API com health check de readiness
- web condicionado à saúde da API

A autenticação em produção espera web e API em hosts HTTPS irmãos do mesmo domínio, por exemplo:

```text
https://www.tools4.tech
https://api.tools4.tech
```

A stack foi preparada para rodar atrás de um reverse proxy/terminador TLS. Consulte [`.env.example`](./.env.example) para o contrato completo de ambiente.

**O deploy de produção ainda não é documentado como ativo.** VPS, reverse proxy, DNS, backup e rollback fazem parte da etapa final de implantação.

## Como contribuir

1. Faça um fork do repositório
2. Crie uma branch a partir de `main`
3. Faça sua alteração
4. Rode os checks relevantes
5. Abra uma pull request explicando o que mudou e por quê

Veja [CONTRIBUTORS.md](./CONTRIBUTORS.md) para os contribuidores do projeto.

## Estado do projeto

A modernização da base está concluída: frameworks atuais, PostgreSQL, migrations, validação de ambiente de produção, hardening de autenticação, health checks, E2E da API, testes do frontend e CI permanente.

O trabalho restante está concentrado nos assets visuais finais e na implantação/operação em produção.

## Licença

Nenhuma licença foi publicada para este repositório até o momento. O código-fonte está publicamente visível, mas direitos de reutilização e redistribuição ainda não foram concedidos por uma licença open source.
