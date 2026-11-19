import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/ai/compare/route'

const mock=vi.hoisted(()=>({from:vi.fn(),select:vi.fn(),in:vi.fn(),neq:vi.fn()}))
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:mock.from})}))

const coolify='50e1b7f8-c809-413d-a10c-846be7f8910d'
const canine='66de52f4-7fbb-4802-bf39-5a392fd40f0c'
const unknown='68c2ba1c-e340-49d0-94e2-5819dfc27167'
const records=[
  {id:coolify,name:'Coolify',link:'https://coolify.io/',description:'Self-hosted platform',
    access_model:'OPEN_SOURCE',access_source_url:'https://coolify.io/pricing',
    category:{name:'DevOps & Infrastructure'}},
  {id:canine,name:'Canine',link:'https://canine.sh/',description:'Kubernetes deployment platform',
    access_model:'OPEN_SOURCE',access_source_url:'https://canine.sh/self-hosted',
    category:{name:'DevOps & Infrastructure'}},
  {id:unknown,name:'Other product',link:'https://example.com/',description:'A search tool',
    access_model:'UNVERIFIED',access_source_url:null,category:{name:'Developer Tools & Utilities'}},
]

const req=(ids:unknown)=>new NextRequest('https://devhub.example/api/ai/compare',{
  method:'POST',headers:{'Content-Type':'application/json','x-real-ip':'198.51.100.2'},
  body:JSON.stringify({ids}),
})

beforeEach(()=>{
  Object.values(mock).forEach(x=>x.mockReset())
  mock.from.mockReturnValue({select:mock.select})
  mock.select.mockReturnValue({in:mock.in})
  mock.in.mockReturnValue({neq:mock.neq})
  mock.neq.mockImplementation(async()=>({data:records.slice(0,2),error:null}))
})
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})

describe('POST /api/ai/compare',()=>{
  it('rejects fewer than two, duplicate, malformed and more than three IDs',async()=>{
    expect((await POST(req([coolify]))).status).toBe(422)
    expect((await POST(req([coolify,coolify]))).status).toBe(422)
    expect((await POST(req([coolify,'other']))).status).toBe(422)
    expect((await POST(req([coolify,canine,unknown,coolify]))).status).toBe(422)
    expect(mock.from).not.toHaveBeenCalled()
  })
  it('returns verified evidence from public catalog and no invented numerical prices',async()=>{
    const response=await POST(req([canine,coolify]))
    expect(response.status).toBe(200)
    const body=await response.json()
    expect(body.tools.map((x:{name:string})=>x.name)).toEqual(['Canine','Coolify'])
    expect(body.tools[0].evidence.sourceUrl).toContain('canine.sh')
    expect(body.tools[1].evidence.limitations.length).toBeGreaterThan(0)
    expect(body.semanticPairs).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(mock.from).toHaveBeenCalledWith('tools')
  })
  it('returns unknown for absent cost/limitation data and excludes paid tools',async()=>{
    mock.neq.mockResolvedValueOnce({data:[records[0],records[2]],error:null})
    let response=await POST(req([coolify,unknown]))
    expect(response.status).toBe(200)
    const body=await response.json()
    expect(body.tools[1].accessModel).toBe('UNVERIFIED')
    expect(body.tools[1].evidence).toMatchObject({
      pricingNote:null,sourceUrl:null,limitations:[],useCases:[],
    })
    mock.neq.mockResolvedValueOnce({data:[records[0]],error:null})
    response=await POST(req([coolify,canine]))
    expect(response.status).toBe(404)
  })
  it('uses signed AI results but rejects pairs with foreign tool IDs',async()=>{
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://sample.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_test')
    vi.stubEnv('DEVHUB_AI_PROXY_SECRET','local-test-secret')
    const fetchMock=vi.fn().mockResolvedValue({
      ok:true,json:async()=>({pairs:[
        {leftId:coolify,rightId:canine,similarity:0.815},
        {leftId:coolify,rightId:'random-id',similarity:0.97},
      ]}),
    })
    vi.stubGlobal('fetch',fetchMock)
    const response=await POST(req([coolify,canine]))
    const body=await response.json()
    expect(body.semanticPairs).toEqual([{leftId:coolify,rightId:canine,similarity:0.815}])
    const [url,options]=fetchMock.mock.calls[0]
    expect(url).toBe('https://sample.supabase.co/functions/v1/devhub-ai-compare')
    expect(options.headers['x-devhub-ai-signature']).toMatch(/^[a-f0-9]{64}$/)
  })
  it('degrades to sourced comparison when AI service is unavailable',async()=>{
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://sample.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_test')
    vi.stubEnv('DEVHUB_AI_PROXY_SECRET','local-test-secret')
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('unavailable')))
    const response=await POST(req([coolify,canine]))
    expect(response.status).toBe(200)
    expect((await response.json()).semanticPairs).toBeNull()
  })
})
