-- Move security-definer helpers out of the publicly exposed PostgREST schema.
-- Existing RLS policies and auth.users trigger reference function OIDs,
-- so changing the helper schema preserves those dependencies.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.is_admin() SET SCHEMA private;
ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Foreign-key indexes identified by the Supabase advisor.
CREATE INDEX IF NOT EXISTS suggestions_category_id_idx ON public.suggestions(category_id);
CREATE INDEX IF NOT EXISTS suggestions_tool_id_idx ON public.suggestions(tool_id);
