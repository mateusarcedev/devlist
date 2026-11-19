-- Public, read-only contributor ranking derived exclusively from approved DevHub suggestions.
-- Store only safe display fields. Do not expose auth.users, profiles.email or raw suggestions.
BEGIN;

ALTER TABLE public.suggestions
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

UPDATE public.suggestions
SET approved_at = created_at
WHERE status = 'APPROVED' AND approved_at IS NULL;

CREATE TABLE public.contributor_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  github_login text NOT NULL,
  avatar_url text NOT NULL,
  is_maintainer boolean NOT NULL DEFAULT false,
  approved_count integer NOT NULL CHECK (approved_count > 0),
  since_year integer NOT NULL CHECK (since_year >= 2000),
  last_approved_at timestamptz NOT NULL,
  recent_tools text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contributor_stats_count_idx
  ON public.contributor_stats(approved_count DESC, last_approved_at DESC);
CREATE INDEX contributor_stats_recent_idx
  ON public.contributor_stats(last_approved_at DESC, approved_count DESC);

ALTER TABLE public.contributor_stats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contributor_stats FROM PUBLIC, anon, authenticated;
-- Column-scoped GRANT deliberately hides the internal Supabase user UUID.
GRANT SELECT (github_login, avatar_url, is_maintainer, approved_count,
  since_year, last_approved_at, recent_tools)
  ON public.contributor_stats TO anon, authenticated;
CREATE POLICY "Published contributor ranking" ON public.contributor_stats
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION private.refresh_public_contributor(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_login text;
  v_provider_id text;
  v_maintainer boolean;
  v_count integer;
  v_first timestamptz;
  v_latest timestamptz;
  v_tools text[];
BEGIN
  -- Github provider_id is verified by Supabase Auth; user_metadata is not.
  SELECT i.identity_data->>'user_name', i.provider_id, (p.role = 'ADMIN')
  INTO v_login, v_provider_id, v_maintainer
  FROM auth.identities i
  JOIN public.profiles p ON p.id = i.user_id
  WHERE i.user_id = p_user_id AND i.provider = 'github'
  LIMIT 1;

  IF v_login IS NULL OR v_login !~ '^[A-Za-z0-9][A-Za-z0-9-]{0,38}$'
     OR v_provider_id IS NULL OR v_provider_id !~ '^[0-9]+$' THEN
    DELETE FROM public.contributor_stats WHERE user_id = p_user_id;
    RETURN;
  END IF;

  SELECT count(*)::integer, min(coalesce(s.approved_at, s.created_at)),
         max(coalesce(s.approved_at, s.created_at))
  INTO v_count, v_first, v_latest
  FROM public.suggestions s
  JOIN public.tools t ON t.id = s.tool_id
  WHERE s.user_id = p_user_id AND s.status = 'APPROVED';

  IF v_count = 0 THEN
    DELETE FROM public.contributor_stats WHERE user_id = p_user_id;
    RETURN;
  END IF;

  SELECT coalesce(array_agg(t.name ORDER BY x.approved_at DESC, x.id DESC),
                  ARRAY[]::text[])
  INTO v_tools
  FROM (
    SELECT s.id, s.tool_id, coalesce(s.approved_at, s.created_at) AS approved_at
    FROM public.suggestions s
    WHERE s.user_id = p_user_id
      AND s.status = 'APPROVED' AND s.tool_id IS NOT NULL
    ORDER BY coalesce(s.approved_at, s.created_at) DESC, s.id DESC
    LIMIT 3
  ) x
  JOIN public.tools t ON t.id = x.tool_id;

  INSERT INTO public.contributor_stats (
    user_id, github_login, avatar_url, is_maintainer, approved_count,
    since_year, last_approved_at, recent_tools, updated_at
  )
  VALUES (
    p_user_id, v_login,
    'https://avatars.githubusercontent.com/u/' || v_provider_id || '?v=4',
    v_maintainer, v_count, extract(year FROM v_first)::integer,
    v_latest, v_tools, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    github_login = excluded.github_login,
    avatar_url = excluded.avatar_url,
    is_maintainer = excluded.is_maintainer,
    approved_count = excluded.approved_count,
    since_year = excluded.since_year,
    last_approved_at = excluded.last_approved_at,
    recent_tools = excluded.recent_tools,
    updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION private.refresh_public_contributor(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.set_contributor_approval_time()
RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status IS DISTINCT FROM 'APPROVED' THEN
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.set_contributor_approval_time() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER set_contributor_approval_time
  BEFORE UPDATE OF status ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION private.set_contributor_approval_time();

CREATE OR REPLACE FUNCTION private.refresh_contributor_on_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    PERFORM private.refresh_public_contributor(NEW.id);
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM private.refresh_public_contributor(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM private.refresh_public_contributor(NEW.user_id);
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM private.refresh_public_contributor(OLD.user_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.refresh_contributor_on_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER refresh_contributor_from_suggestion
  AFTER INSERT OR UPDATE OR DELETE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION private.refresh_contributor_on_change();
CREATE TRIGGER refresh_contributor_from_role
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.refresh_contributor_on_change();

-- Recreate an accurate snapshot if this migration is applied after existing approvals.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.suggestions WHERE status = 'APPROVED'
  LOOP
    PERFORM private.refresh_public_contributor(r.user_id);
  END LOOP;
END;
$$;
COMMIT;
