import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'node:crypto'

export const runtime = 'nodejs'

const noStore = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** Public, bounded proxy; Supabase Edge Function performs semantic inference.
 * The only returned entries come from the existing curated database. */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)
  const query = body && typeof body === 'object' && 'query' in body
    ? (body as { query: unknown }).query : null

  if (typeof query !== 'string' || query.trim().length < 8 || query.trim().length > 300)
    return noStore({ message: 'Descreva sua necessidade em 8 a 300 caracteres.' }, 422)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secret = process.env.DEVHUB_AI_PROXY_SECRET
  if (!url || !key || !secret) return noStore({ message: 'Busca inteligente indisponível.' }, 503)

  const ip = request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const hashedIp = createHash('sha256').update(ip).digest('hex')
  const timestamp = String(Date.now())
  const signature = createHmac('sha256',secret).update(timestamp + '\n' + hashedIp + '\n' + query.trim()).digest('hex')
  try {
    const response = await fetch(url + '/functions/v1/devhub-ai-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        'x-devhub-client-ip': hashedIp,
        'x-devhub-ai-timestamp': timestamp,
        'x-devhub-ai-signature': signature,
      },
      body: JSON.stringify({ query: query.trim() }),
      cache: 'no-store',
      signal: AbortSignal.timeout(45_000),
    })
    const result: unknown = await response.json().catch(() => null)
    if (!result || typeof result !== 'object' || !('results' in result) && response.ok)
      return noStore({ message: 'Resposta inválida da busca inteligente.' }, 503)

    // Never relay arbitrary fields or allow paid/unverified recommendations.
    if (response.ok) {
      const data = result as { results?: unknown }
      if (!Array.isArray(data.results)) return noStore({ message: 'Resposta inválida.' }, 503)
      const tools = data.results.filter((item): item is Record<string,unknown> =>
        typeof item === 'object' && item !== null &&
        typeof item.id === 'string' && typeof item.name === 'string' &&
        typeof item.description === 'string' && typeof item.link === 'string' &&
        typeof item.categoryName === 'string' &&
        ['OPEN_SOURCE','FREE','FREEMIUM'].includes(String(item.accessModel)) &&
        /^https:\/\//.test(item.link),
      ).slice(0,6).map(item => ({
        id: item.id, name: item.name, link: item.link,
        description: item.description, categoryName: item.categoryName,
        accessModel: item.accessModel,
      }))
      return noStore({ results: tools }, 200)
    }
    const message = 'message' in result && typeof (result as {message:unknown}).message === 'string'
      ? String((result as {message:string}).message).slice(0,150) : 'Busca inteligente temporariamente indisponível.'
    return noStore({ message }, response.status === 429 ? 429 : 503)
  } catch (error) {
    console.error('DevHub AI proxy failed', error)
    return noStore({ message: 'Busca inteligente temporariamente indisponível.' }, 503)
  }
}
