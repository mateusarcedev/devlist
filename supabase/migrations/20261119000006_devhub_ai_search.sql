-- DevHub AI: semantic search index and a bounded public search budget.
-- No provider keys or user prompts are stored.
BEGIN;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE public.tool_ai_embeddings (
  tool_id uuid PRIMARY KEY REFERENCES public.tools(id) ON DELETE CASCADE,
  content_hash text NOT NULL,
  embedding extensions.vector(384) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tool_ai_embeddings_vector_idx ON public.tool_ai_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops);
ALTER TABLE public.tool_ai_embeddings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tool_ai_embeddings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_ai_embeddings TO service_role;

-- Returns only IDs and similarity; metadata is fetched from the live catalog.
CREATE FUNCTION public.match_devhub_ai_tools(
  query_embedding extensions.vector(384),
  match_count int DEFAULT 12
)
RETURNS TABLE (tool_id uuid, similarity double precision)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT e.tool_id, (1 - (e.embedding OPERATOR(extensions.<=>) query_embedding))::double precision
  FROM public.tool_ai_embeddings e
  JOIN public.tools t ON t.id=e.tool_id
  WHERE t.access_model IN ('OPEN_SOURCE','FREE','FREEMIUM')
  ORDER BY e.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT LEAST(GREATEST(match_count,1),24);
$$;
REVOKE ALL ON FUNCTION public.match_devhub_ai_tools(extensions.vector,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.match_devhub_ai_tools(extensions.vector,int) TO service_role;

CREATE TABLE public.ai_search_usage (
  ip_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY(ip_hash,window_start)
);
ALTER TABLE public.ai_search_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_search_usage FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ai_search_usage TO service_role;

-- Atomic hourly cap for the public search endpoint; callable only with service_role.
CREATE FUNCTION public.consume_devhub_ai_slot(p_ip_hash text)
RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE accepted integer;
BEGIN
  IF length(p_ip_hash) <> 64 OR p_ip_hash !~ '^[0-9a-f]+$' THEN RETURN FALSE; END IF;
  INSERT INTO public.ai_search_usage(ip_hash,window_start,request_count)
  VALUES(p_ip_hash,date_trunc('hour',now()),1)
  ON CONFLICT(ip_hash,window_start)
  DO UPDATE SET request_count=public.ai_search_usage.request_count + 1
  WHERE public.ai_search_usage.request_count < 24
  RETURNING request_count INTO accepted;
  RETURN accepted IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_devhub_ai_slot(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_devhub_ai_slot(text) TO service_role;
COMMIT;
