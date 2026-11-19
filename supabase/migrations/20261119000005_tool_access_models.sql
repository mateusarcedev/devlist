-- Catalog access classification: no guesses for unknown legacy entries.
-- Paid-only tools are retained for audit but hidden from public discovery.
BEGIN;
ALTER TABLE public.tools ADD COLUMN access_model text NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN access_source_url text,
  ADD COLUMN access_reviewed_at timestamptz;
ALTER TABLE public.tools ADD CONSTRAINT tools_access_model_valid
  CHECK (access_model IN ('OPEN_SOURCE','FREE','FREEMIUM','PAID','UNVERIFIED'));
ALTER TABLE public.tools ADD CONSTRAINT tools_access_source_valid
  CHECK (access_source_url IS NULL OR (length(access_source_url)<=500 AND access_source_url ~* '^https://[^[:space:]]+$'));
ALTER TABLE public.suggestions ADD COLUMN access_model text NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN access_source_url text;
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_access_model_valid
  CHECK (access_model IN ('OPEN_SOURCE','FREE','FREEMIUM','PAID','UNVERIFIED'));
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_access_source_valid
  CHECK (access_source_url IS NULL OR (length(access_source_url)<=500 AND access_source_url ~* '^https://[^[:space:]]+$'));

-- Conservative, provisional mapping of well-known projects. All other legacy
-- records remain UNVERIFIED and must be reviewed; never assume FREE by default.
UPDATE public.tools t SET access_model = known.model
FROM (VALUES
('anijs.github.io','OPEN_SOURCE'),
('animate.style','OPEN_SOURCE'),
('michalsnik.github.io','OPEN_SOURCE'),
('ariakit.org','OPEN_SOURCE'),
('astro.build','OPEN_SOURCE'),
('goauthentik.io','OPEN_SOURCE'),
('getbootstrap.com','OPEN_SOURCE'),
('boringavatars.com','OPEN_SOURCE'),
('chartdb.io','OPEN_SOURCE'),
('daisyui.com','OPEN_SOURCE'),
('dashy.to','OPEN_SOURCE'),
('docmost.com','OPEN_SOURCE'),
('dozzle.dev','OPEN_SOURCE'),
('feathericons.com','OPEN_SOURCE'),
('flyonui.com','OPEN_SOURCE'),
('franken-ui.dev','OPEN_SOURCE'),
('grapesjs.com','OPEN_SOURCE'),
('headlessui.com','OPEN_SOURCE'),
('heroicons.dev','OPEN_SOURCE'),
('hyperui.dev','OPEN_SOURCE'),
('iconoir.com','OPEN_SOURCE'),
('listmonk.app','OPEN_SOURCE'),
('matcha.mizu.sh','OPEN_SOURCE'),
('mkdocs.org','OPEN_SOURCE'),
('motioncanvas.io','OPEN_SOURCE'),
('nezha.wiki','OPEN_SOURCE'),
('ntfy.sh','OPEN_SOURCE'),
('openwebui.com','OPEN_SOURCE'),
('outstatic.com','OPEN_SOURCE'),
('docs.paperless-ngx.com','OPEN_SOURCE'),
('penpot.app','OPEN_SOURCE'),
('phosphoricons.com','OPEN_SOURCE'),
('radix-ui.com','OPEN_SOURCE'),
('react.email','OPEN_SOURCE'),
('react-icons.github.io','OPEN_SOURCE'),
('rxresu.me','OPEN_SOURCE'),
('remix.run','OPEN_SOURCE'),
('remixicon.com','OPEN_SOURCE'),
('select2.org','OPEN_SOURCE'),
('shields.io','OPEN_SOURCE'),
('simpleicons.org','OPEN_SOURCE'),
('streamlit.io','OPEN_SOURCE'),
('swapy.tahazsh.com','OPEN_SOURCE'),
('sweetalert2.github.io','OPEN_SOURCE'),
('swiperjs.com','OPEN_SOURCE'),
('tablericons.com','OPEN_SOURCE'),
('threejs.org','OPEN_SOURCE'),
('getzola.org','OPEN_SOURCE'),
('1001fonts.com','FREE'),
('abstractfonts.com','FREE'),
('color.adobe.com','FREE'),
('avvvatars.com','FREE'),
('colorhunt.co','FREE'),
('freecodecamp.org','FREE'),
('fonts.google.com','FREE'),
('pexels.com','FREE'),
('undraw.co','FREE'),
('pokeapi.co','FREE'),
('api.nasa.gov','FREE'),
('getwaves.io','FREE'),
('coolors.co','FREEMIUM'),
('bannerify.co','FREEMIUM'),
('flaticon.com','FREEMIUM'),
('fontawesome.com','FREEMIUM'),
('iconscout.com','FREEMIUM'),
('lottiefiles.com','FREEMIUM'),
('mobbin.com','FREEMIUM'),
('mintlify.com','FREEMIUM'),
('sanity.io','FREEMIUM'),
('rapidapi.com','FREEMIUM'),
('convertio.co','FREEMIUM'),
('tailwindui.com','PAID')
) AS known(host,model)
WHERE lower(regexp_replace(split_part(split_part(t.link,'://',2),'/',1),'^www[.]','')) = known.host;

-- Verified against the publishers' current pricing pages.
UPDATE public.tools SET access_source_url='https://tailwindcss.com/blog/tailwind-plus',access_reviewed_at=now()
 WHERE lower(link) LIKE 'https://tailwindui.com/%';
UPDATE public.tools SET access_source_url='https://bannerify.co/pricing',access_reviewed_at=now()
 WHERE lower(link) LIKE 'https://bannerify.co/%';
UPDATE public.tools SET access_source_url='https://mobbin.com/',access_reviewed_at=now()
 WHERE lower(link) LIKE 'https://mobbin.com/%';

DROP POLICY IF EXISTS "Read tools" ON public.tools;
CREATE POLICY "Public read nonpaid tools" ON public.tools FOR SELECT TO anon,authenticated
 USING (access_model <> 'PAID');
CREATE POLICY "Admin read all tools" ON public.tools FOR SELECT TO authenticated
 USING ((select private.is_admin()));

DROP FUNCTION IF EXISTS public.review_suggestion(uuid,text,text,text,uuid);
CREATE OR REPLACE FUNCTION public.review_suggestion(
  p_id uuid, p_action text, p_name text DEFAULT NULL,
  p_description text DEFAULT NULL, p_category_id uuid DEFAULT NULL,
  p_access_model text DEFAULT NULL, p_access_source_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  s public.suggestions%ROWTYPE;
  v_tool_id uuid;
  v_key text;
  v_other_name text;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_admin() THEN
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

  IF p_access_model IS NOT NULL AND p_access_model NOT IN ('OPEN_SOURCE','FREE','FREEMIUM','PAID','UNVERIFIED') THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid access model';
  END IF;
  IF p_access_source_url IS NOT NULL AND (length(p_access_source_url)>500 OR p_access_source_url !~* '^https://[^[:space:]]+$') THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid source URL';
  END IF;
  IF p_action='approve' AND (p_access_model IS NULL OR p_access_model NOT IN ('OPEN_SOURCE','FREE','FREEMIUM')) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Only free, freemium, or open-source tools can be approved';
  END IF;

  IF p_action='save' THEN
    UPDATE public.suggestions SET name=btrim(p_name),description=btrim(p_description),
      category_id=p_category_id,access_model=COALESCE(p_access_model,s.access_model),
      access_source_url=p_access_source_url WHERE id=p_id AND status='PENDING';
    RETURN NULL;
  END IF;

  v_key := CASE WHEN s.host='github.com'
    THEN lower(trim(trailing '/' FROM regexp_replace(split_part(s.link,'#',1),'^https?://(www\\.)?','','i')))
    ELSE s.host END;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('suggestion-url:'||v_key,0));
  SELECT t.name INTO v_other_name FROM public.tools t
  WHERE (s.host<>'github.com' AND
    regexp_replace(lower(split_part(split_part(split_part(split_part(t.link,'://',2),'/',1),'?',1),'#',1)),'^www[.]','')=s.host)
    OR (s.host='github.com' AND
      lower(trim(trailing '/' FROM regexp_replace(split_part(t.link,'#',1),'^https?://(www\\.)?','','i')))=v_key)
  LIMIT 1;
  IF v_other_name IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE='D4091', MESSAGE=v_other_name||' já está no catálogo';
  END IF;

  INSERT INTO public.tools(name,link,description,category_id,access_model,access_source_url,access_reviewed_at)
  VALUES(btrim(p_name),s.link,btrim(p_description),p_category_id,p_access_model,p_access_source_url,now())
  RETURNING id INTO v_tool_id;

  UPDATE public.suggestions SET name=btrim(p_name),description=btrim(p_description),
    category_id=p_category_id,access_model=p_access_model,access_source_url=p_access_source_url,
    tool_id=v_tool_id,status='APPROVED',
    reviewed_by_id=auth.uid(),reviewed_at=now()
  WHERE id=p_id AND status='PENDING';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='D4093', MESSAGE='Suggestion already reviewed';
  END IF;
  RETURN v_tool_id;
END;
$$;
REVOKE ALL ON FUNCTION public.review_suggestion(uuid,text,text,text,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_suggestion(uuid,text,text,text,uuid,text,text) TO authenticated;
COMMIT;
