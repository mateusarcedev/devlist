import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getComparisonEvidence, parseComparisonIds, type ComparedTool, type SemanticPair } from '@/lib/comparison-facts'
import { isAccessModel } from '@/lib/tool-access'

export const runtime = 'nodejs'
const noStore = (body:unknown,status=200) => NextResponse.json(body,{
  status,headers:{'Cache-Control':'no-store'},
})

type ToolRow = {
  id:string;name:string;link:string;description:string
  access_model:string;access_source_url:string|null
  category:{name:string}|{name:string}[]|null
}

function secureSource(url: string|null):string|null {
  if(!url)return null
  try { const parsed=new URL(url);return parsed.protocol==='https:'?parsed.toString():null }
  catch { return null }
}

/** The server fetches all facts from the authenticated/anonymous Supabase session.
 * The AI endpoint receives IDs only and returns numeric semantic similarity; it can
 * never insert prices, limitations or other ungrounded product claims. */
export async function POST(request:NextRequest) {
  const body:unknown = await request.json().catch(()=>null)
  const ids=parseComparisonIds(body && typeof body==='object' && 'ids' in body ?
    (body as {ids:unknown}).ids : null)
  if(!ids)return noStore({message:'Selecione duas ou três ferramentas diferentes do catálogo.'},422)

  try {
    const db=await createClient()
    const {data,error}=await db.from('tools')
      .select('id,name,link,description,access_model,access_source_url,category:categories(name)')
      .in('id',ids).neq('access_model','PAID')
    if(error)throw error
    const rows=(data??[]) as unknown as ToolRow[]
    if(rows.length!==ids.length)return noStore({message:'Uma ou mais ferramentas não estão disponíveis no catálogo público.'},404)
    const byId=new Map(rows.map(row=>[row.id,row]))
    const tools:ComparedTool[]=ids.map(id=>{
      const row=byId.get(id)!
      const categoryName=Array.isArray(row.category)?row.category[0]?.name??'':row.category?.name??''
      return {
        id:row.id,name:row.name,link:row.link,description:row.description,
        categoryName,accessModel:isAccessModel(row.access_model)?row.access_model:'UNVERIFIED',
        accessSourceUrl:secureSource(row.access_source_url),
        evidence:getComparisonEvidence(row.name,row.link),
      }
    })

    let semanticPairs:SemanticPair[]|null=null
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const secret=process.env.DEVHUB_AI_PROXY_SECRET
    if(url&&key&&secret){
      const ip=request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      const hash=createHash('sha256').update(ip).digest('hex')
      const timestamp=String(Date.now())
      const signature=createHmac('sha256',secret)
        .update(timestamp+'\n'+hash+'\n'+ids.join(',')).digest('hex')
      try {
        const response=await fetch(url+'/functions/v1/devhub-ai-compare',{
          method:'POST',
          headers:{
            'Content-Type':'application/json',apikey:key,
            'x-devhub-client-ip':hash,
            'x-devhub-ai-timestamp':timestamp,
            'x-devhub-ai-signature':signature,
          },
          body:JSON.stringify({ids}),
          cache:'no-store',
          signal:AbortSignal.timeout(30_000),
        })
        if(response.ok){
          const result:unknown=await response.json()
          if(result&&typeof result==='object'&&'pairs' in result&&
            Array.isArray((result as {pairs:unknown}).pairs)){
            const allowed=new Set(ids)
            const seen=new Set<string>()
            semanticPairs=(result as {pairs:unknown[]}).pairs.flatMap(value=>{
              if(!value||typeof value!=='object')return []
              const item=value as Record<string,unknown>
              if(typeof item.leftId!=='string'||typeof item.rightId!=='string'||
                !allowed.has(item.leftId)||!allowed.has(item.rightId)||
                item.leftId===item.rightId || typeof item.similarity!=='number'||
                !Number.isFinite(item.similarity)||item.similarity<0||item.similarity>1)return []
              const pairKey=[item.leftId,item.rightId].sort().join('|')
              if(seen.has(pairKey))return []
              seen.add(pairKey)
              return [{leftId:item.leftId,rightId:item.rightId,similarity:item.similarity}]
            })
          }
        }
      }catch(error){
        console.warn('Semantic comparison unavailable, returning verified catalog facts',error)
      }
    }
    return noStore({tools,semanticPairs})
  }catch(error){
    console.error('Comparison catalog lookup failed',error)
    return noStore({message:'Não foi possível carregar os dados do catálogo para comparação.'},503)
  }
}
