# Supabase + Vercel migration

Use a **new Supabase project**. Keep the original NestJS/Prisma production system intact until tested cutover. This branch initially prepares the migration without changing live infrastructure.

## Architecture
- Next.js app deployed to Vercel, with Supabase Auth / Postgres and per-table RLS.
- GitHub OAuth is implemented by Supabase Auth; no home-grown JWT or refresh-token storage.
- GitHub contributors can continue to use server-side GitHub API requests.
- Never ship a Supabase service-role secret in any `NEXT_PUBLIC_*` environment variable.

## Setup
1. Create a Supabase project and install the Supabase CLI.
2. Run `supabase login`, `supabase link --project-ref YOUR_REF`, and `supabase db push`.
3. Enable GitHub login in Supabase Auth. In the GitHub OAuth App configure callback `https://YOUR_REF.supabase.co/auth/v1/callback`.
4. Set Auth Site URL and allow callbacks `http://localhost:3000/auth/callback` and `https://YOUR_PRODUCTION_HOST/auth/callback`.
5. Import GitHub repository into Vercel with Root Directory `apps/web`, and configure pnpm/workspace build.
6. Copy environment values from `apps/web/.env.supabase.example`. Set the public URL, publishable key, and site URL in Vercel.
7. Test catalog as anonymous, favorites and suggestions as logged-in user, admin insert, RLS isolation, and sign-out/refresh.

## Data/identity migration
1. Back up the existing PostgreSQL database and verify a test restore.
2. Export old `categories`, `tools`, `users`, `favorites`, `suggestions` into restricted staging tables.
3. Import categories and tools preserving their UUID IDs and relationships.
4. Every legacy user must sign in using Supabase GitHub OAuth; legacy session cookies cannot migrate.
5. Map the legacy numeric `githubId` to the **verified** GitHub provider ID associated with each Supabase `auth.users.id` (UUID). Do not match only by email or name.
6. Import favorites/suggestions by joining their legacy user IDs to the verified mapping. Verify owner and count totals before release.
7. Promote the new stack only after parity, RLS tests, and monitoring pass. Keep the original service for rollback.

## Admin bootstrap
Only a privileged database operator may run `update public.profiles set role = 'ADMIN' where id = '<verified UUID>';` after identifying the correct user. Never allow UI or OAuth metadata to grant admin status.

## Naming
The owner has requested a rename. Do not change GitHub repository, DNS or OAuth settings until a name and domain are approved. Historical repository identifiers remain for now.

## Deployment policy
Do not merge this branch or disable the old API before all production deployment requirements are validated. Schema migrations are forward-only and must be backed up.