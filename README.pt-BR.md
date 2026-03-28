# devlist

> Descubra as ferramentas que devs realmente usam — descobertas e organizadas pela comunidade.

[🇺🇸 English](./README.md)

---

## Por que o devlist existe?

Encontrar boas ferramentas de desenvolvimento é mais difícil do que devia ser.
As recomendações estão espalhadas em threads do Twitter, newsletters, listas aleatórias
e conversas no Slack — sem contexto, sem curadoria, sem saber se alguém realmente usa aquilo.

O devlist centraliza isso. Uma plataforma open source onde a comunidade descobre,
favorita e sugere ferramentas — e você vê o que devs de verdade estão usando.

---

## O que você pode fazer

- **Explorar** ferramentas organizadas por categoria
- **Favoritar** as que fazem parte do seu workflow (login com GitHub)
- **Sugerir** novas ferramentas para a comunidade avaliar

---

## Preview

> 🚧 Em breve — [devlist.mateusarce.dev](https://devlist.mateusarce.dev)

<!-- Adicionar screenshot aqui quando o deploy estiver no ar -->

---

## Rodando localmente

> Para contribuidores que querem rodar o projeto na própria máquina.

### Pré-requisitos

- Node.js 20+
- pnpm (frontend) / npm (backend)
- Docker

### 1. Banco de dados

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

> Swagger disponível em `http://localhost:3001/api`

---

## Contribuindo

1. Fork o repositório e crie uma branch para sua mudança
2. Certifique-se que os testes passam: `npm run test` em `/api`
3. Abra um PR descrevendo o que mudou e por quê

Contribuidores são reconhecidos em [`CONTRIBUTORS.md`](./CONTRIBUTORS.md).

---

## Tech Stack

| Camada   | Tecnologia                                               |
|----------|----------------------------------------------------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, TanStack Query     |
| Backend  | NestJS 10, Prisma ORM                                    |
| Banco    | PostgreSQL                                               |
| Auth     | NextAuth v4 (GitHub OAuth)                               |
