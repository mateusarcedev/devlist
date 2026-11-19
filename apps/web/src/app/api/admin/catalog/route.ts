import { adminClient, noStore } from '@/lib/admin-suggestions'

export const runtime = 'nodejs'
export async function GET() {
  const { db, error } = await adminClient()
  if (error || !db) return error!
  const { data, error: dbError } = await db.from('tools')
    .select('id,name,link,access_model,access_source_url,access_reviewed_at')
    .order('name').limit(1000)
  if (dbError) return noStore({ message: 'Não foi possível carregar as classificações.' }, 500)
  return noStore({ tools: data ?? [] })
}
