-- Isolated secret for authenticating the Next.js AI proxy to the Edge Function.
-- The secret value is provisioned outside git; never embed it in migrations.
BEGIN;
CREATE TABLE public.ai_search_proxy_secrets (
  id text PRIMARY KEY CHECK(id = 'next_proxy'),
  secret text NOT NULL CHECK(length(secret) >= 40),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_search_proxy_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_search_proxy_secrets FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.ai_search_proxy_secrets TO service_role;
COMMIT;
