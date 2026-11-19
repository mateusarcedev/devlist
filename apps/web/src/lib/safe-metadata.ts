import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { request as httpsRequest } from 'node:https'
import { request as httpRequest } from 'node:http'
import { checkServerIdentity } from 'node:tls'
import { normalizeSuggestionUrl } from '@/lib/suggestion-url'

function publicAddress(address:string):boolean {
  if (isIP(address) === 4) {
    const octets=address.split('.').map(Number)
    const [a,b,c] = octets
    return !(a===0||a===10||a===127||a>=224||a===169&&b===254||
      a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||
      a===192&&b===0&&c===0||a===192&&b===0&&c===2||
      a===198&&(b===18||b===19||b===51&&c===100)||
      a===203&&b===0&&c===113)
  }
  if(isIP(address)===6) {
    const ip=address.toLowerCase()
    if(ip.includes('.')) return false
    if(ip==='::'||ip==='::1'||ip.startsWith('::ffff:'))return false
    const first=parseInt(ip.split(':')[0]||'0',16)
    return first>=0x2000&&first<=0x3fff&&
      !(ip.startsWith('2001:db8:')||ip.startsWith('2001:0db8:'))
  }
  return false
}

function extract(html:string,key:string):string {
  const escape=key.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')
  const re=new RegExp('<meta\\s+[^>]*(?:property|name)\\s*=\\s*["\\\']'+escape+'["\\\'][^>]*>','i')
  const tag=html.match(re)?.[0] ?? ''
  return tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]?.trim()??''
}
function clean(value:string,max:number) {
  return value.replace(/<[^>]*>/g,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim().slice(0,max)
}

export async function readSafeMetadata(raw:string) {
  const normalized=normalizeSuggestionUrl(raw)
  const url=new URL(normalized.url)
  if(url.port||url.username||url.password||url.hostname==='localhost'||isIP(url.hostname)) throw new Error('Unsafe URL')
  const resolved=await lookup(url.hostname,{all:true,verbatim:true})
  if(!resolved.length||resolved.some(record=>!publicAddress(record.address))) throw new Error('Private address blocked')
  const target=resolved.find(record=>record.family===4)??resolved[0]
  const requester=url.protocol==='https:'?httpsRequest:httpRequest
  const html=await new Promise<string>((resolve,reject)=>{
    const req=requester({
      hostname:target.address,port:url.protocol==='https:'?443:80,path:url.pathname+url.search,
      method:'GET',headers:{Host:url.host,'User-Agent':'DevHub-Metadata/1.0','Accept':'text/html'},
      ...(url.protocol==='https:'?{
        servername:url.hostname,
        checkServerIdentity:(_:string,cert:Parameters<typeof checkServerIdentity>[1])=>checkServerIdentity(url.hostname,cert),
      }:{}),
      timeout:5000,
    },response=>{
      if(response.statusCode!==200||!(response.headers['content-type']??'').includes('text/html')){
        response.destroy();reject(new Error('No HTML metadata'));return
      }
      let text=''
      response.setEncoding('utf8')
      response.on('data',(chunk:string)=>{
        text+=chunk
        if(text.length>98304){req.destroy(new Error('Metadata too large'))}
      })
      response.on('end',()=>resolve(text))
      response.on('error',reject)
    })
    req.on('timeout',()=>req.destroy(new Error('Metadata timeout')))
    req.on('error',reject)
    req.end()
  })
  const title=extract(html,'og:title')||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''
  const description=extract(html,'og:description')||extract(html,'description')
  return { name:clean(title,120),description:clean(description,140) }
}
