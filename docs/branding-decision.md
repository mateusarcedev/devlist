# DevHub naming decision

- Product: **DevHub** (approved November 19, 2026).
- Canonical production URL: **https://devhub.mateusarce.dev**.
- Frontend platform: Vercel / Next.js 16.
- Backend platform: Supabase Auth + PostgreSQL with RLS.
- Frontend OAuth return URL: `https://devhub.mateusarce.dev/auth/callback`.
- GitHub OAuth app callback: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`.
- Source repository remains `mateusarcedev/devlist` temporarily for compatibility.

Selecting the name/domain does **not** mean DNS, Supabase, or Vercel have been deployed. Verify each separately. Do not rename the GitHub repository or workspace packages without a follow-up migration.
