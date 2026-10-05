import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI should use the direct connection when available.
    // Keeping the value optional allows prisma generate to run in CI without DB credentials.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
