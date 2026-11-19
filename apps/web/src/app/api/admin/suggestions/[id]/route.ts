import { adminClient, moderationError, noStore, parseFields } from '@/lib/admin-suggestions'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { db, error } = await adminClient()
  if (error || !db) return error!
  const fields = parseFields(await request.json().catch(() => null))
  if (!fields) return noStore({ message: 'Nome e descrição são obrigatórios (até 140 caracteres).' }, 422)
  const { id } = await params
  const { error: reviewError } = await db.rpc('review_suggestion', {
    p_id:id, p_action:'save', p_name:fields.name,
    p_description:fields.description, p_category_id:fields.categoryId,
  })
  if (reviewError) return moderationError(reviewError)
  return noStore({ saved:true })
}
