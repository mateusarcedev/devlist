import { buildLlmsText } from '@/lib/seo/llms'

export const revalidate = 3600

export async function GET(): Promise<Response> {
  return new Response(await buildLlmsText('en'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
