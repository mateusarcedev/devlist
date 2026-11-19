-- Stage 5: review queue, atomic moderation, and contributor credit.
BEGIN;
ALTER TABLE public.suggestions
  ADD COLUMN IF NOT EXISTS duplicate_of_tool_id uuid REFERENCES public.tools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata_fetched_at timestamptz;
CREATE INDEX IF NOT EXISTS suggestions_status_created_idx ON public.suggestions(status,created_at DESC);
CREATE INDEX IF NOT EXISTS suggestions_host_idx ON public.suggestions(host);
-- Admins may see public display names of submitters, never other users' emails.
CREATE POLICY "Admins read submitter profiles" ON public.profiles FOR SELECT
  TO authenticated USING ((select public.is_admin()));
-- No direct client edits to moderation fields: only the guarded RPC can write them.
REVOKE UPDATE, DELETE ON public.suggestions FROM authenticated;
DROP POLICY IF EXISTS "Admins update suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Admins delete suggestions" ON public.suggestions;

CREATE OR REPLACE FUNCTION public.review_suggestion(
  p_id uuid, p_action text, p_name text DEFAULT NULL,
  p_description text DEFAULT NULL, p_category_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  s public.suggestions%ROWTYPE;
  v_tool_id uuid;
  v_key text;
  v_other_name text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Administrator required';
  END IF;
  IF p_action NOT IN ('save','approve','reject') THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid review action';
  END IF;
  SELECT * INTO s FROM public.suggestions WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='Suggestion not found';
  END IF;
  IF s.status <> 'PENDING' THEN
    RAISE EXCEPTION USING ERRCODE='D4093', MESSAGE='Suggestion already reviewed';
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.suggestions
    SET status='REJECTED',reviewed_by_id=auth.uid(),reviewed_at=now()
    WHERE id=p_id AND status='PENDING';
    RETURN NULL;
  END IF;

  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 120 OR
     p_description IS NULL OR length(btrim(p_description)) NOT BETWEEN 1 AND 140 OR
     (p_action='approve' AND p_category_id IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid name, description, or category';
  END IF;
  IF p_category_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.categories WHERE id=p_category_id) THEN
    RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='Unknown category';
  END IF;

  IF p_action='save' THEN
    UPDATE public.suggestions SET name=btrim(p_name),description=btrim(p_description),
      category_id=p_category_id WHERE id=p_id AND status='PENDING';
    RETURN NULL;
  END IF;

  v_key := CASE WHEN s.host='github.com'
    THEN lower(trim(trailing '/' FROM regexp_replace(split_part(s.link,'#',1),'^https?://(www\\.)?','','i')))
    ELSE s.host END;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('suggestion-url:'||v_key,0));
  SELECT t.name INTO v_other_name FROM public.tools t
  WHERE (s.host<>'github.com' AND
    regexp_replace(lower(split_part(split_part(split_part(split_part(t.link,'://',2),'/',1),'?',1),'#',1)),'^www\\.','')=s.host)
    OR (s.host='github.com' AND
      lower(trim(trailing '/' FROM regexp_replace(split_part(t.link,'#',1),'^https?://(www\\.)?','','i')))=v_key)
  LIMIT 1;
  IF v_other_name IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE='D4091', MESSAGE=v_other_name||' já está no catálogo';
  END IF;

  INSERT INTO public.tools(name,link,description,category_id)
  VALUES(btrim(p_name),s.link,btrim(p_description),p_category_id)
  RETURNING id INTO v_tool_id;

  UPDATE public.suggestions SET name=btrim(p_name),description=btrim(p_description),
    category_id=p_category_id,tool_id=v_tool_id,status='APPROVED',
    reviewed_by_id=auth.uid(),reviewed_at=now()
  WHERE id=p_id AND status='PENDING';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='D4093', MESSAGE='Suggestion already reviewed';
  END IF;
  RETURN v_tool_id;
END;
$$;
REVOKE ALL ON FUNCTION public.review_suggestion(uuid,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_suggestion(uuid,text,text,text,uuid) TO authenticated;
COMMIT;
