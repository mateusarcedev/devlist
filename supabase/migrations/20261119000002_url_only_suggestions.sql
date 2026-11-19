-- URL-only DevHub suggestions. Apply after 20261119000001_security_hardening.sql.
-- Name/description/category will be filled by the review workflow (stage 5).
BEGIN;

ALTER TABLE public.suggestions
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN category_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS host text;

-- Preserve existing suggestions from the previous form, if any.
UPDATE public.suggestions
SET host = regexp_replace(
  lower(split_part(split_part(split_part(split_part(link, '://', 2), '/', 1), '?', 1), '#', 1)),
  '^www\.', ''
)
WHERE host IS NULL;

-- Only one pending suggestion for a domain, except GitHub repositories,
-- which must be compared by their full URL.
CREATE UNIQUE INDEX IF NOT EXISTS suggestions_pending_domain_unique_idx
  ON public.suggestions(host)
  WHERE status = 'PENDING' AND host <> 'github.com';
CREATE UNIQUE INDEX IF NOT EXISTS suggestions_pending_github_link_unique_idx
  ON public.suggestions ((lower(trim(trailing '/' FROM split_part(link, '#', 1)))))
  WHERE status = 'PENDING' AND host = 'github.com';

CREATE INDEX IF NOT EXISTS suggestions_user_created_at_idx
  ON public.suggestions(user_id, created_at DESC);

-- This function is deliberately outside exposed public schema: the trigger
-- needs privileged catalog/pending lookups but must not expose other users' submissions.
CREATE OR REPLACE FUNCTION private.guard_new_suggestion()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_authority text;
  v_host text;
  v_key text;
  v_name text;
  v_part text;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid()
    OR NEW.status IS DISTINCT FROM 'PENDING'::public.suggestion_status
    OR NEW.tool_id IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Not allowed to submit for another user';
  END IF;

  IF NEW.link IS NULL OR length(NEW.link) > 2048 OR
     NEW.link !~* '^https?://' OR NEW.link ~ '[[:space:]]' THEN
    RAISE EXCEPTION USING ERRCODE = 'D4220', MESSAGE = 'Invalid tool URL';
  END IF;

  v_authority := lower(
    split_part(split_part(split_part(split_part(NEW.link, '://', 2), '/', 1), '?', 1), '#', 1)
  );
  IF v_authority ~ '[:@]' THEN
    RAISE EXCEPTION USING ERRCODE = 'D4220', MESSAGE = 'Invalid tool URL';
  END IF;
  v_host := regexp_replace(v_authority, '^www\.', '');
  IF length(v_host) > 253 OR
     v_host !~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' OR
     v_host ~ '^[0-9.]+$' THEN
    RAISE EXCEPTION USING ERRCODE = 'D4220', MESSAGE = 'Invalid tool URL';
  END IF;

  FOREACH v_part IN ARRAY string_to_array(v_host, '.') LOOP
    IF length(v_part) > 63 OR left(v_part, 1) = '-' OR right(v_part, 1) = '-' THEN
      RAISE EXCEPTION USING ERRCODE = 'D4220', MESSAGE = 'Invalid tool URL';
    END IF;
  END LOOP;

  v_key := CASE WHEN v_host = 'github.com'
    THEN lower(trim(trailing '/' FROM split_part(NEW.link, '#', 1)))
    ELSE v_host END;

  -- Serialize per-user rate checks, then identical domain/URL checks.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('suggestion-user:' || NEW.user_id::text, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('suggestion-url:' || v_key, 0));

  IF (SELECT count(*) FROM public.suggestions
      WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION USING ERRCODE = 'D4290', MESSAGE = 'Suggestion rate limit reached';
  END IF;

  SELECT t.name INTO v_name
  FROM public.tools t
  WHERE (v_host <> 'github.com' AND
         regexp_replace(
           lower(split_part(split_part(split_part(split_part(t.link, '://', 2), '/', 1), '?', 1), '#', 1)),
           '^www\.', ''
         ) = v_host)
     OR (v_host = 'github.com' AND
         lower(trim(trailing '/' FROM split_part(t.link, '#', 1))) = v_key)
  LIMIT 1;

  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'D4091', MESSAGE = v_name || ' já está no catálogo.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.suggestions s WHERE s.status = 'PENDING'
    AND (CASE WHEN v_host = 'github.com'
      THEN s.host = 'github.com' AND
           lower(trim(trailing '/' FROM split_part(s.link, '#', 1))) = v_key
      ELSE s.host = v_host END)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'D4092', MESSAGE = 'Already pending';
  END IF;

  -- User controls only the URL, never editorial/review fields.
  NEW.host := v_host;
  NEW.name := NULL;
  NEW.description := NULL;
  NEW.category_id := NULL;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_new_suggestion() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_new_suggestion ON public.suggestions;
CREATE TRIGGER guard_new_suggestion
  BEFORE INSERT ON public.suggestions FOR EACH ROW
  EXECUTE FUNCTION private.guard_new_suggestion();

-- Keep the existing user-scoped SELECT and INSERT policies on suggestions.
-- Writes remain RLS protected; users cannot update or delete pending entries.
COMMIT;
