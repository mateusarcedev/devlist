import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type Status = 'PENDING' | 'APPROVED' | 'REJECTED'
export const statuses: Status[] = ['PENDING','APPROVED','REJECTED']

export function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function adminClient() {
  const db = await createClient()
  const { data: auth, error } = await db.auth.getUser()
  if (error || !auth.user) return { error: noStore({ message: 'Entre com GitHub.' }, 401) }
  const { data: profile, error: profileError } = await db.from('profiles')
    .select('role').eq('id', auth.user.id).single()
  if (profileError || profile?.role !== 'ADMIN') return { error: noStore({ message: 'Acesso restrito a administradores.' }, 403) }
  return { db, user: auth.user }
}

export function parseFields(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string,unknown>
  if (typeof body.name !== 'string' || typeof body.description !== 'string' ||
    (body.categoryId !== null && typeof body.categoryId !== 'string')) return null
  const name = body.name.trim(), description = body.description.trim()
  if (!name || name.length > 120 || !description || description.length > 140) return null
  if (body.categoryId && !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(body.categoryId)) return null
  return { name, description, categoryId: body.categoryId || null }
}

export function moderationError(error: { code?: string, message?: string }) {
  if (error.code === 'D4093' || error.code === 'D4091' || error.code === '23505')
    return noStore({ message: error.message ?? 'Conflito na revisão.' }, 409)
  if (error.code === '22023' || error.code === '23503')
    return noStore({ message: 'Preencha nome, descrição (até 140 caracteres) e categoria válida.' }, 422)
  return noStore({ message: 'Não foi possível salvar a revisão.' }, 500)
}
