import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.81.1'

// gte-small runs inside Supabase Edge Functions; no external AI API key is used.
// Its training is English-focused, so common PT-BR development terms are expanded.
const session = new Supabase.ai.Session('gte-small')
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})
type AccessModel = 'OPEN_SOURCE' | 'FREE' | 'FREEMIUM'
type DbTool = {
  id: string; name: string; link: string; description: string
  access_model: AccessModel; category: { name: string } | { name: string }[] | null
}
type Tool = Omit<DbTool,'category'> & { categoryName: string }
type VectorCache = { tool_id: string; content_hash: string }
type Match = { tool_id: string; similarity: number }

const expansions: Record<string,string> = {
  preciso: 'need', quero: 'want', busco: 'find', encontrar: 'find', ferramenta: 'tool',
  ferramentas: 'tools', hospedar: 'deploy host', hospedagem: 'hosting', servidor: 'server',
  servidores: 'servers', aplicacoes: 'applications apps', aplicacao: 'application app',
  aplicativo: 'application', aplicativos: 'apps', implantar: 'deploy', implantacao: 'deployment',
  gratis: 'free', gratuito: 'free', gratuita: 'free', pagar: 'pay paid', custo: 'cost',
  codigo: 'code', aberto: 'open source', alternativa: 'alternative', alternativas: 'alternatives',
  banco: 'database', dados: 'data', pesquisa: 'search', busca: 'search',
  pesquisar: 'search', monitoramento: 'monitoring', monitorar: 'monitor',
  infraestrutura: 'infrastructure', testes: 'testing', teste: 'test',
  diagramas: 'diagrams', diagrama: 'diagram', design: 'design', icones: 'icons',
  animacao: 'animation', animacoes: 'animations', documentos: 'documents',
  documentacao: 'documentation', anotacoes: 'notes', anotacao: 'note',
  produtividade: 'productivity', automatizar: 'automation', automacao: 'automation',
  converter: 'convert', arquivos: 'files', arquivo: 'file', imagens: 'images',
  imagem: 'image', aprender: 'learn', ensino: 'learning', cursos: 'courses',
  seguranca: 'security', autenticacao: 'authentication', autenticar: 'authenticate',
  nuvem: 'cloud', containers: 'containers docker', conteineres: 'containers docker',
  sem: 'without', minha: 'my', meu: 'my', proprio: 'self hosted', propria: 'self hosted',
}
const stop = new Set([
  'a','as','o','os','de','do','da','dos','das','em','na','no','nas','nos','para','por',
  'com','que','uma','um','ao','e','eu','preciso','quero','minha','meu','sem',
  'the','and','for','with','into','what','how','can','i','need','my','to','on','a',
])
function clean(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
function translate(value: string) {
  const normalized = clean(value).replace(/[^a-z0-9.+#-]+/g, ' ')
  return normalized.split(/\s+/).map(word => expansions[word] ?? word).join(' ')
}
function terms(value: string) {
  return [...new Set(translate(value).split(/\s+/).filter(v => v.length > 2 && !stop.has(v)))]
}
function toolText(tool: Tool) {
  return tool.name + '. ' + tool.categoryName + '. ' + tool.description
}
function lexical(tool: Tool, searchTerms: string[]) {
  const name = translate(tool.name)
  const category = translate(tool.categoryName)
  const description = translate(tool.description)
  const hostname = new URL(tool.link).hostname.toLowerCase()
  return searchTerms.reduce((score, term) => score +
    (name.includes(term) ? 5 : 0) +
    (category.includes(term) ? 2.5 : 0) +
    (description.includes(term) ? 2 : 0) +
    (hostname.includes(term) ? 1 : 0), 0)
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2,'0')).join('')
}
function embedInput(tool: Tool) {
  return translate(toolText(tool)).slice(0,1500)
}
async function embedding(input: string): Promise<number[]> {
  const result = await session.run(input, { mean_pool: true, normalize: true }) as number[]
  if (!Array.isArray(result) || result.length !== 384 || result.some(x => !Number.isFinite(x)))
    throw new Error('Invalid embedding')
  return result
}
async function indexTool(tool: Tool, hash: string) {
  const vector = await embedding(embedInput(tool))
  const { error } = await db.from('tool_ai_embeddings').upsert({
    tool_id: tool.id, content_hash: hash, embedding: JSON.stringify(vector), updated_at: new Date().toISOString(),
  }, { onConflict: 'tool_id' })
  if (error) throw error
}
let backfillRunning = false
async function indexRemaining(entries: {tool:Tool;hash:string}[]) {
  if (backfillRunning) return
  backfillRunning = true
  try {
    for (const item of entries.slice(0,90)) {
      try { await indexTool(item.tool,item.hash) }
      catch (e) { console.error('AI index item failed', item.tool.id, e) }
    }
  } finally { backfillRunning = false }
}
const respond = (body: unknown, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}})

Deno.serve(async (req) => {
  if (req.method !== 'POST') return respond({message:'Method not allowed'},405)
  try {
    if (Number(req.headers.get('content-length') ?? 0) > 2048)
      return respond({message:'Consulta muito longa.'},413)
    const raw = await req.text()
    if (raw.length > 2048) return respond({message:'Consulta muito longa.'},413)
    const body = JSON.parse(raw)
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (query.length < 8 || query.length > 300) return respond({message:'Descreva sua necessidade em 8 a 300 caracteres.'},422)

    const ip = req.headers.get('x-devhub-client-ip') ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const key = await sha256(ip + ':' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.slice(-24))
    const { data: allowed, error: quotaError } = await db.rpc('consume_devhub_ai_slot', { p_ip_hash: key })
    if (quotaError) throw quotaError
    if (!allowed) return respond({ message: 'Limite de buscas atingido. Tente novamente mais tarde.' },429)

    const { data: catalog, error: catalogError } = await db.from('tools')
      .select('id,name,link,description,access_model,category:categories(name)')
      .in('access_model',['OPEN_SOURCE','FREE','FREEMIUM']).limit(1000)
    if (catalogError) throw catalogError
    const tools: Tool[] = ((catalog ?? []) as unknown as DbTool[]).map(item => ({
      id:item.id,name:item.name,link:item.link,description:item.description,
      access_model:item.access_model,
      categoryName:Array.isArray(item.category)?(item.category[0]?.name??''):(item.category?.name??''),
    }))
    const { data: cache, error: cacheError } = await db.from('tool_ai_embeddings')
      .select('tool_id,content_hash').limit(1000)
    if (cacheError) throw cacheError
    const cached = new Map(((cache??[]) as VectorCache[]).map(row=>[row.tool_id,row.content_hash]))
    const searchTerms = terms(query)
    const lexicalRanks = tools.map(tool=>({tool,lex:lexical(tool,searchTerms)}))
      .sort((a,b)=>b.lex-a.lex)
    const needsIndex: {tool:Tool;hash:string}[] = []
    for (const item of tools) {
      const hash = await sha256(toolText(item))
      if (cached.get(item.id)!==hash) needsIndex.push({tool:item,hash})
    }
    // Prime the highest lexical candidates on the first query, then finish
    // reindexing in background. No tool is ever invented or returned from an LLM.
    for (const {tool} of lexicalRanks.slice(0,8)) {
      const pending = needsIndex.find(item=>item.tool.id===tool.id)
      if (!pending) continue
      await indexTool(pending.tool,pending.hash)
      cached.set(pending.tool.id,pending.hash)
    }
    const queryVector = await embedding(translate(query))
    const {data:matched,error:matchError}=await db.rpc('match_devhub_ai_tools',{
      query_embedding:JSON.stringify(queryVector),match_count:24,
    })
    if (matchError) throw matchError
    const scores = new Map(((matched??[]) as Match[]).map(item=>[item.tool_id,item.similarity]))
    const candidates = [...new Map([
      ...lexicalRanks.slice(0,15).map(item=>[item.tool.id,item.tool] as const),
      ...tools.filter(tool=>scores.has(tool.id)).map(tool=>[tool.id,tool] as const),
    ]).values()]
    const results = candidates.map(tool=>{
      const similarity = scores.get(tool.id)??0
      const lexicalScore = lexical(tool,searchTerms)
      return { tool, relevance: 0.70*Math.max(0,similarity) + 0.30*Math.min(1,lexicalScore/10),
        similarity,lexicalScore }
    }).filter(item=>item.lexicalScore>0 || item.similarity>0.47)
      .sort((a,b)=>b.relevance-a.relevance).slice(0,6)
      .map(({tool})=>({
        id:tool.id,name:tool.name,link:tool.link,description:tool.description,
        accessModel:tool.access_model,categoryName:tool.categoryName,
      }))
    const rest = needsIndex.filter(item=>cached.get(item.tool.id)!==item.hash)
    if (rest.length) EdgeRuntime.waitUntil(indexRemaining(rest))
    return respond({results,source:'catalog',semantic:true})
  } catch (e) {
    console.error('DevHub AI search failed', e)
    return respond({message:'Não foi possível concluir a busca inteligente.'},503)
  }
})
