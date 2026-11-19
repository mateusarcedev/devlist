import { adminClient, noStore } from '@/lib/admin-suggestions'
import { readSafeMetadata } from '@/lib/safe-metadata'

export const runtime='nodejs'
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {db,error}=await adminClient()
  if(error||!db)return error!
  const {id}=await params
  const {data:suggestion}=await db.from('suggestions').select('link,status').eq('id',id).single()
  if(!suggestion)return noStore({message:'Sugestão não encontrada.'},404)
  if(suggestion.status!=='PENDING')return noStore({message:'Sugestão já revisada.'},409)
  try {
    const metadata=await readSafeMetadata(suggestion.link)
    return noStore(metadata)
  } catch {
    return noStore({name:'',description:'',message:'Metadados indisponíveis. Preencha manualmente.'})
  }
}
