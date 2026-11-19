import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.81.1'

// Private comparison inference: embedding similarity is an indicator only.
// The model does not generate or supply pricing, limitations or product claims.
const session = new Supabase.ai.Session('gte-small')
const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{
  auth:{persistSession:false,autoRefreshToken:false},
})
const respond = (data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}})
const validUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

async function sha256(value:string):Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,'0')).join('')
}
async function vector(text:string):Promise<number[]> {
  const result = await session.run(text.slice(0,1500),{mean_pool:true,normalize:true}) as number[]
  if (!Array.isArray(result) || result.length!==384 || result.some(x=>!Number.isFinite(x)))
    throw new Error('Invalid AI embedding')
  return result
}
function cosine(a:number[],b:number[]):number {
  let dot=0,aa=0,bb=0
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}
  return aa>0&&bb>0 ? Math.min(1,Math.max(0,dot/Math.sqrt(aa*bb))) : 0
}

Deno.serve(async req=>{
  if(req.method!=='POST')return respond({message:'Method not allowed'},405)
  try{
    if(Number(req.headers.get('content-length')??0)>1024)return respond({message:'Payload too large'},413)
    const raw=await req.text()
    if(raw.length>1024)return respond({message:'Payload too large'},413)
    const body=JSON.parse(raw)
    const ids=body?.ids
    if(!Array.isArray(ids)||ids.length<2||ids.length>3||
      !ids.every((id:unknown)=>typeof id==='string'&&validUuid.test(id))||
      new Set(ids).size!==ids.length)
      return respond({message:'Select 2 or 3 distinct catalog tools'},422)

    const timestamp=req.headers.get('x-devhub-ai-timestamp')??''
    const signature=req.headers.get('x-devhub-ai-signature')??''
    const clientHash=req.headers.get('x-devhub-client-ip')??''
    const sentAt=Number(timestamp)
    if(!/^\d{13}$/.test(timestamp)||!Number.isFinite(sentAt)||
       Math.abs(Date.now()-sentAt)>120_000||
       !/^[a-f0-9]{64}$/.test(signature)||!/^[a-f0-9]{64}$/.test(clientHash))
      return respond({message:'Not authorized'},403)
    const {data:proxy,error:proxyError}=await db.from('ai_search_proxy_secrets')
      .select('secret').eq('id','next_proxy').single()
    if(proxyError||!proxy?.secret)throw new Error('Proxy not configured')
    const signer=await crypto.subtle.importKey('raw',new TextEncoder().encode(proxy.secret),
      {name:'HMAC',hash:'SHA-256'},false,['sign'])
    const digest=new Uint8Array(await crypto.subtle.sign('HMAC',signer,
      new TextEncoder().encode(timestamp+'\n'+clientHash+'\n'+ids.join(','))))
    const expected=Array.from(digest).map(x=>x.toString(16).padStart(2,'0')).join('')
    let mismatch=0
    for(let index=0;index<64;index++)mismatch|=expected.charCodeAt(index)^signature.charCodeAt(index)
    if(mismatch)return respond({message:'Not authorized'},403)

    const key=await sha256(clientHash+':'+Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.slice(-24))
    const {data:allowed,error:limitError}=await db.rpc('consume_devhub_ai_slot',{p_ip_hash:key})
    if(limitError)throw limitError
    if(!allowed)return respond({message:'Rate limit reached'},429)

    const {data:tools,error:toolError}=await db.from('tools')
      .select('id,name,description,access_model').in('id',ids).neq('access_model','PAID')
    if(toolError)throw toolError
    if(!tools||tools.length!==ids.length)return respond({message:'Tool not available'},404)
    const byId=new Map(tools.map(tool=>[tool.id,tool]))
    const vectors=new Map<string,number[]>()
    for(const id of ids){
      const tool=byId.get(id)!
      vectors.set(id,await vector(tool.name+'. '+tool.description))
    }

    const pairs:{leftId:string;rightId:string;similarity:number}[]=[]
    for(let i=0;i<ids.length;i++){
      for(let j=i+1;j<ids.length;j++){
        pairs.push({
          leftId:ids[i],rightId:ids[j],
          similarity:Math.round(cosine(vectors.get(ids[i])!,vectors.get(ids[j])!)*1000)/1000,
        })
      }
    }
    return respond({pairs,model:'gte-small',source:'catalog-descriptions'})
  }catch(error){
    console.error('DevHub semantic comparison unavailable',error)
    return respond({message:'Semantic comparison is temporarily unavailable'},503)
  }
})
