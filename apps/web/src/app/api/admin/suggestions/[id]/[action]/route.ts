import { adminClient, moderationError, noStore, parseFields } from '@/lib/admin-suggestions'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export async function POST(request: NextRequest, { params }: { params: Promise<{ id:string,action:string }> }) {
  const { db, error } = await adminClient()
  if (error || !db) return error!
  const { id, action } = await params
  if (action !== 'approve' && action !== 'reject') return noStore({ message:'Ação inválida.' },422)
  const fields = action === 'approve' ? parseFields(await request.json().catch(() => null)) : null
  if (action === 'approve' && (!fields || !fields.categoryId))
    return noStore({ message:'Nome, categoria e descrição são obrigatórios.' },422)
  const { data, error: reviewError } = await db.rpc('review_suggestion', {
    p_id:id, p_action:action, p_name:fields?.name ?? null,
    p_description:fields?.description ?? null, p_category_id:fields?.categoryId ?? null,
  })
  if (reviewError) return moderationError(reviewError)
  return noStore({ status:action === 'approve' ? 'APPROVED':'REJECTED', toolId:data })
}
