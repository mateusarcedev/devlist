import CompareContent from '@/components/CompareContent'
import { parseComparisonIds } from '@/lib/comparison-facts'
import { loadVisibleTools } from '@/lib/catalog-tools'
import { pageMetadata } from '@/lib/seo/metadata'
import { toCategory } from '@/lib/supabase/mappers'
import { createClient } from '@/lib/supabase/server'
import type { Category, Tool } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = pageMetadata({
  title: 'Compare developer tools',
  description: 'Compare real open-source, free and freemium developer tools with sourced use cases, costs and limitations.',
  path: '/compare',
})

interface Props {
  searchParams?: Promise<{tools?:string|string[]}>
}

async function catalog():Promise<{tools:Tool[];categories:Category[];error:boolean}>{
  try {
    const db=await createClient()
    const [toolsResult,categoriesResult]=await Promise.all([
      loadVisibleTools(db),
      db.from('categories').select('id,name').order('name'),
    ])
    if(toolsResult.error||categoriesResult.error)return {tools:[],categories:[],error:true}
    return {
      tools:toolsResult.tools,
      categories:(categoriesResult.data??[]).map(toCategory),
      error:false,
    }
  }catch(error){
    console.error('Unable to load comparison catalog',error)
    return {tools:[],categories:[],error:true}
  }
}

export default async function ComparePage({searchParams}:Props){
  const params=searchParams?await searchParams:{}
  const raw='tools' in params && typeof params.tools==='string'?params.tools:''
  const initialIds=parseComparisonIds(raw.split(','))??[]
  const data=await catalog()
  const validIds=initialIds.every(id=>data.tools.some(tool=>tool.id===id))?initialIds:[]
  return <CompareContent tools={data.tools} categories={data.categories}
    initialIds={validIds} loadError={data.error}/>
}
