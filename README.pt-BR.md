# Tools4.tech

> Um catálogo mantido pela comunidade para descobrir, salvar e sugerir ferramentas úteis para desenvolvedores.

[![CI](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml/badge.svg)](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Node](https://img.shields.io/badge/Node.js-24-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-black)

[English](./README.md)

## O que é o Tools4.tech?

O **Tools4.tech** é um diretório open source de ferramentas para desenvolvedores.

Em vez de depender de favoritos espalhados, posts em redes sociais ou listas privadas, desenvolvedores podem navegar por um catálogo curado, filtrar por categoria, salvar favoritos, sugerir novas ferramentas e contribuir com o próprio projeto.

> O repositório mantém o nome histórico `devlist`, mas o nome do produto é **Tools4.tech**.

## Visão do produto

| Área | O que faz |
| --- | --- |
| Discover | Explora e pesquisa o catálogo completo, com filtros por categoria |
| Categorias | Abre diretórios específicos para cada categoria |
| Favorites | Salva ferramentas em uma lista pessoal após login com GitHub |
| Suggest a tool | Envia sugestões pelo fluxo autenticado da comunidade |
| Contributors | Exibe pessoas que contribuem com o repositório |
| Admin | Cria itens do catálogo por um fluxo administrativo protegido pela API |

A interface atual usa um design escuro, compacto e focado em desenvolvedores, com navegação acessível, layouts responsivos, estados globais de loading/erro, suporte a teclado e preferência por redução de movimento.

## Principais funcionalidades

- Catálogo público organizado por categoria
- Pesquisa e filtros por categoria
- Autenticação com GitHub OAuth
- Fluxo de access/refresh token com cookies HTTP-only
- Favoritos pessoais
- Sugestões da comunidade
- Diretório de contribuidores com dados do GitHub
- Mutações administrativas protegidas pela API
- Migrations PostgreSQL e seed de demonstração
- Endpoints de health/readiness para produção
- Quality Gate permanente no CI
- Estados responsivos e acessíveis no frontend
- Metadata Open Graph para compartilhamento

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

No GitHub OAuth App local:

```text
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3001/auth/callback/github
```

### 4. Configure o frontend

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

Execute os principais checks localmente:

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

Toda pull request para `main` passa pelo **Quality Gate** do GitHub Actions, incluindo migrations PostgreSQL, testes/E2E da API, testes do frontend, lint, typecheck e builds de produção.

## Topologia de produção

O Docker Compose de produção inclui PostgreSQL, job de migrations, perfil opcional para seed demo, API com health check de readiness e frontend condicionado à saúde da API.

A topologia de autenticação em produção usa hosts HTTPS irmãos sob o mesmo domínio:

```text
https://www.tools4.tech
https://api.tools4.tech
```

A stack está preparada para rodar atrás de um reverse proxy / terminador TLS. Consulte [`.env.example`](./.env.example) para o contrato completo de ambiente.

A aplicação está atualmente na **fase de implantação em produção**. Provisionamento da VPS, reverse proxy, DNS, TLS, OAuth de produção, backups, rollback e documentação operacional são as etapas finais.

## Open source

O Tools4.tech é distribuído sob a [Licença MIT](./LICENSE).

Documentos úteis:

- [Guia de contribuição](./CONTRIBUTING.md)
- [Política de segurança](./SECURITY.md)
- [Contribuidores](./CONTRIBUTORS.md)

## Estado do projeto

A base da aplicação e o redesign do frontend estão concluídos.

Já foram finalizados: atualização dos frameworks, PostgreSQL, migrations, validação de ambiente, hardening de autenticação, autorização da API, health checks, E2E do backend, testes do frontend, CI, interface responsiva, estados de acessibilidade e documentação open source.

O trabalho restante está concentrado no deploy de produção e nas capturas/validações operacionais pós-deploy.
