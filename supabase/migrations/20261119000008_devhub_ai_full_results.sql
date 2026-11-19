-- Keep the model-restricted catalog search while allowing every relevant indexed tool
-- to participate in ranking instead of restricting semantic candidates to 24.
CREATE OR REPLACE FUNCTION public.match_devhub_ai_tools(
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
  LIMIT LEAST(GREATEST(match_count,1),1000);
$$;
REVOKE ALL ON FUNCTION public.match_devhub_ai_tools(extensions.vector,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.match_devhub_ai_tools(extensions.vector,int) TO service_role;
