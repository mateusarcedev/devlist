import { adminClient, noStore } from '@/lib/admin-suggestions'
import { isAccessModel } from '@/lib/tool-access'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { db, error } = await adminClient()
  if (error || !db) return error!
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return noStore({ message: 'ID inválido.' }, 422)
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return noStore({ message: 'Dados inválidos.' }, 422)
  const value = body as Record<string, unknown>
  if (!isAccessModel(value.accessModel) || (value.sourceUrl !== undefined && typeof value.sourceUrl !== 'string'))
    return noStore({ message: 'Classificação inválida.' }, 422)
  const sourceUrl = (value.sourceUrl as string | undefined)?.trim() || null
  if (sourceUrl && (sourceUrl.length > 500 || !/^https:\/\/[^\s]+$/i.test(sourceUrl)))
    return noStore({ message: 'Use uma URL HTTPS válida para a fonte.' }, 422)
  const { data, error: updateError } = await db.from('tools')
    .update({
      access_model: value.accessModel,
      access_source_url: value.accessModel === 'UNVERIFIED' ? null : sourceUrl,
      access_reviewed_at: value.accessModel === 'UNVERIFIED' ? null : new Date().toISOString(),
    })
    .eq('id', id)
    .select('id,name,link,access_model,access_source_url,access_reviewed_at')
    .maybeSingle()
  if (updateError) return noStore({ message: 'Falha ao atualizar classificação.' }, 500)
  if (!data) return noStore({ message: 'Ferramenta não encontrada.' }, 404)
  return noStore({ tool: data })
}


/** Permanently remove a catalog tool. RLS restricts deletion to administrators;
 * existing favorites cascade and suggestion references are cleared by FKs. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { db, error } = await adminClient()
  if (error || !db) return error!
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return noStore({ message: 'ID inválido.' }, 422)

  const { data, error: deleteError } = await db.from('tools')
    .delete()
    .eq('id', id)
    .select('id,name')
    .maybeSingle()
  if (deleteError) {
    if (deleteError.code === '23503')
      return noStore({ message: 'Esta ferramenta ainda possui referências que impedem a exclusão.' }, 409)
    return noStore({ message: 'Não foi possível excluir a ferramenta.' }, 500)
  }
  if (!data) return noStore({ message: 'Ferramenta não encontrada.' }, 404)
  return noStore({ deleted: data })
}
