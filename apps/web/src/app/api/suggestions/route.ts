import { createClient } from '@/lib/supabase/server'
import { normalizeSuggestionUrl, SuggestionUrlError } from '@/lib/suggestion-url'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

/** GitHub-authenticated suggestion submission; RLS and the database insert guard
 * remain authoritative even when callers bypass this API route. */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Envie um objeto JSON com o campo url.' }, 422)
  }
  if (!body || typeof body !== 'object' || typeof (body as {url?:unknown}).url !== 'string') {
    return json({ message: 'Envie um objeto JSON com o campo url.' }, 422)
  }

  let normalized: ReturnType<typeof normalizeSuggestionUrl>
  try {
    normalized = normalizeSuggestionUrl((body as {url:string}).url)
  } catch (error) {
    return json({
      message: error instanceof SuggestionUrlError
        ? error.message
        : 'Esse link não parece válido. Ex.: https://exemplo.com',
    }, 422)
  }

  try {
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) {
      return json({ message: 'Entre com GitHub para enviar a sugestão.' }, 401)
    }
    const { data, error } = await supabase
      .from('suggestions')
      .insert({ user_id: auth.user.id, link: normalized.url })
      .select('id,host')
      .single()

    if (error) {
      if (error.code === 'D4091') return json({ message: error.message }, 409)
      if (error.code === 'D4092' || error.code === '23505') {
        return json({ message: 'Este link já foi sugerido e está em revisão.' }, 409)
      }
      if (error.code === 'D4290') {
        return json({ message: 'Limite de sugestões atingido. Tente novamente mais tarde.' }, 429)
      }
      if (error.code === 'D4220' || error.code === '23514') {
        return json({ message: 'Esse link não parece válido. Ex.: https://exemplo.com' }, 422)
      }
      // The preview cannot save submissions before the schema migration is applied.
      if (error.code === 'PGRST204' || error.code === '42703') {
        return json({ message: 'As sugestões estão temporariamente indisponíveis.' }, 503)
      }
      console.error('Suggestion insert failed', { code: error.code })
      return json({ message: 'Não foi possível enviar a sugestão. Tente novamente.' }, 500)
    }
    return json({ id: data.id, host: data.host ?? normalized.host }, 201)
  } catch {
    return json({ message: 'O serviço de sugestões está indisponível no momento.' }, 503)
  }
}
