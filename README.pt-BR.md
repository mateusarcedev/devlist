# DevHub

> Catálogo colaborativo para descobrir, salvar e sugerir ferramentas para desenvolvedores.

[![CI](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml/badge.svg)](https://github.com/mateusarcedev/devlist/actions/workflows/ci.yml)
[![Licença MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

[English](./README.md)

**Endereço planejado:** https://devhub.mateusarce.dev

O repositório continua usando o nome técnico `mateusarcedev/devlist` para preservar o histórico e as integrações. **DevHub** é o nome público do produto.

## Funcionalidades

O DevHub permite pesquisar e explorar ferramentas por categoria, salvar favoritos, sugerir novas ferramentas para moderação e consultar os contribuidores do projeto. O login pelo GitHub habilita recursos pessoais, e administradores podem gerenciar o catálogo. A interface oferece português e inglês, temas claro e escuro e layout responsivo.

## Arquitetura de destino

```text
Navegador
   |
   v
Next.js 16 / React 19 (Vercel)
   |                           |
   |                           +-- Dados de contribuidores via GitHub (servidor)
   v
Supabase Auth (GitHub OAuth) + API de dados / RLS
   |
   v
PostgreSQL do Supabase
```

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TanStack Query |
| Backend | Supabase Auth, API de dados, PostgreSQL, Row Level Security |
| Monorepo | pnpm / Turborepo |
| Testes web | Vitest / Testing Library |
| Hospedagem | Vercel (web) e Supabase (banco e autenticação) |

O antigo `apps/api` com NestJS/Prisma, Docker Compose, Caddy e scripts operacionais permanecem temporariamente para consulta e possibilidade de reversão. **Não** fazem parte da arquitetura futura de hospedagem.

## Desenvolvimento local

Requisitos: Node.js 24.21+ e pnpm 12.9.1.

```bash
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
# Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
pnpm --filter @devlist/web dev
```

Crie um projeto Supabase, habilite o OAuth GitHub, aplique as migrations em `supabase/migrations` e cadastre `http://localhost:3000/auth/callback` como URL de retorno permitida. O callback do GitHub deve apontar para `https://<project-ref>.supabase.co/auth/v1/callback`.

Consulte o [roteiro de migração Supabase + Vercel](./docs/migration-supabase-vercel.md) para dados, segurança e permissões.

## Verificação de qualidade

```bash
pnpm --filter @devlist/web lint
pnpm --filter @devlist/web test
pnpm --filter @devlist/web typecheck
pnpm --filter @devlist/web build
```

O GitHub Actions continua verificando a API antiga até a sua retirada.

## Publicação na Vercel

Importe este repositório como Next.js e configure **Root Directory: `apps/web`**. Variáveis de produção:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
NEXT_PUBLIC_SITE_URL=https://devhub.mateusarce.dev
```

Associe o domínio `devhub.mateusarce.dev` e permita `https://devhub.mateusarce.dev/auth/callback` nos redirecionamentos do Supabase Auth. Valide DNS, autenticação, políticas RLS e propriedade dos dados antes de publicar.

**Situação:** O código de integração com Supabase já foi incorporado, mas a criação do projeto, a migração de dados e o deploy real na Vercel ainda exigem validação. O roteiro antigo de VPS está [marcado como legado](./docs/deployment.md).

## Código aberto

O DevHub utiliza a [licença MIT](./LICENSE). Consulte [como contribuir](./CONTRIBUTING.md), [segurança](./SECURITY.md) e [contribuidores](./CONTRIBUTORS.md).
