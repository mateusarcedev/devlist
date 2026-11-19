import { adminClient, noStore, statuses } from '@/lib/admin-suggestions'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const { db, error } = await adminClient()
  if (error || !db) return error!
  const status = request.nextUrl.searchParams.get('status') ?? 'PENDING'
  if (!statuses.includes(status as (typeof statuses)[number]))
    return noStore({ message: 'Status inválido.' }, 422)

  const { data, error: dbError } = await db.from('suggestions')
    .select('id,link,host,user_id,created_at,status,name,description,category_id,access_model,access_source_url,tool_id,reviewed_at')
    .eq('status', status).order('created_at', { ascending: false }).limit(100)
  if (dbError) return noStore({ message: 'Erro ao carregar sugestões.' }, 500)
  const ids = [...new Set((data ?? []).map(x => x.user_id))]
  const { data: profiles } = ids.length
    ? await db.from('profiles').select('id,name,github_id').in('id', ids)
    : { data: [] as { id:string,name:string,github_id:number|null }[] }
  const users = new Map((profiles ?? []).map(p => [p.id, p]))
  const { data: tools } = await db.from('tools').select('id,name,link').limit(2000)
  const byHost = new Map<string,{id:string,name:string}>()
  for (const tool of tools ?? []) {
    try {
      const host = new URL(tool.link).hostname.replace(/^www\./,'').toLowerCase()
      if (host !== 'github.com') byHost.set(host,{id:tool.id,name:tool.name})
      else byHost.set(tool.link.replace(/\/$/,'').toLowerCase(),{id:tool.id,name:tool.name})
    } catch { /* legacy URL */ }
  }
  return noStore({ suggestions: (data ?? []).map(s => ({
    ...s,
    submitter: users.get(s.user_id)?.name || 'GitHub user',
    duplicate: byHost.get(s.host === 'github.com' ? s.link.replace(/\/$/,'').toLowerCase() : s.host),
  })) })
}
