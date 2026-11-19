import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/ai/search/route'

const makeRequest = (body: unknown) => new NextRequest('https://devhub.example/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.7' },
  body: JSON.stringify(body),
})
const tool = {
  id:'00000000-0000-4000-8000-000000000001',
  name:'Coolify',link:'https://coolify.io/',description:'Deploy on your VPS',
  categoryName:'DevOps & Infrastructure', accessModel:'OPEN_SOURCE',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('POST /api/ai/search', () => {
  it('rejects invalid or oversized prompts without remote AI calls', async () => {
    const remote = vi.fn()
    vi.stubGlobal('fetch',remote)
    expect((await POST(makeRequest({query:'short'}))).status).toBe(422)
    expect((await POST(makeRequest({query:'a'.repeat(301)}))).status).toBe(422)
    expect(remote).not.toHaveBeenCalled()
  })

  it('returns catalog-grounded recommendations and removes non-free entries', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://sample.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_publishable_test')
    vi.stubEnv('DEVHUB_AI_PROXY_SECRET','test-secret-not-for-production')
    const remote = vi.fn().mockResolvedValue({
      ok:true,status:200,json:async()=>({results:[
        tool,{...tool,name:'Paid Tool',accessModel:'PAID'},
        {...tool,name:'Unreviewed Tool',accessModel:'UNVERIFIED'},
        {...tool,name:'Unsafe Link',link:'javascript:alert(1)'},
      ]}),
    })
    vi.stubGlobal('fetch',remote)
    const response = await POST(makeRequest({query:'I need to deploy Docker apps on a VPS'}))
    expect(response.status).toBe(200)
    expect((await response.json()).results).toEqual([tool])
    expect(remote).toHaveBeenCalledWith('https://sample.supabase.co/functions/v1/devhub-ai-search',
      expect.objectContaining({ method:'POST',body:JSON.stringify({query:'I need to deploy Docker apps on a VPS'}) }))
    const args = remote.mock.calls[0][1]
    expect(args.headers['x-devhub-ai-signature']).toMatch(/^[a-f0-9]{64}$/)
    expect(args.headers['x-devhub-ai-timestamp']).toMatch(/^\d{13}$/)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('propagates the rate limit without exposing internal details', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://sample.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_publishable_test')
    vi.stubEnv('DEVHUB_AI_PROXY_SECRET','test-secret-not-for-production')
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({
      ok:false,status:429,json:async()=>({message:'Limite de buscas atingido.'}),
    }))
    const response = await POST(makeRequest({query:'Recommend a free hosted database'}))
    expect(response.status).toBe(429)
  })

  it('fails safely when the search service is unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://sample.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_publishable_test')
    vi.stubEnv('DEVHUB_AI_PROXY_SECRET','test-secret-not-for-production')
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('gateway unavailable')))
    const response = await POST(makeRequest({query:'Recommend a free hosted database'}))
    expect(response.status).toBe(503)
  })
})
