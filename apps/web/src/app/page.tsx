import DiscoverContent from '@/components/DiscoverContent'
import type { Category, Tool } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { toCategory } from '@/lib/supabase/mappers'
import { loadVisibleTools } from '@/lib/catalog-tools'
import { JsonLd } from '@/components/seo/JsonLd'
import { homeJsonLd } from '@/lib/seo/jsonld'

interface DirectoryData {
  tools: Tool[]
  categories: Category[]
  loadError: boolean
}

async function getDirectoryData(): Promise<DirectoryData> {
  try {
    const supabase = await createClient()
    const [toolsResult, categoriesResult] = await Promise.all([
      loadVisibleTools(supabase),
      supabase.from('categories').select('id,name').order('name'),
    ])
    if (toolsResult.error || categoriesResult.error) {
      return { tools: [], categories: [], loadError: true }
    }
    return {
      tools: toolsResult.tools,
      categories: (categoriesResult.data ?? []).map(toCategory),
      loadError: false,
    }
  } catch (error) {
    console.error('Failed to load Supabase catalog', error)
    return { tools: [], categories: [], loadError: true }
  }
}

interface PageProps { searchParams?: Promise<{ q?: string | string[] }> }

export default async function Home({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const raw = typeof params.q === 'string' ? params.q : ''
  const initialQuery = raw.slice(0,120)
  const { tools, categories, loadError } = await getDirectoryData()
  const labels = new Map(categories.map(category=>[category.id,category.name]))
  const seoTools = tools.filter(tool=>labels.has(tool.categoryId)).map(tool=>({
    id:tool.id, name:tool.name, url:tool.link, description:tool.description,
    category: { id:tool.categoryId, name:labels.get(tool.categoryId)! },
  }))
  return (
    <>
      {!loadError && <JsonLd data={homeJsonLd(seoTools)} />}
      <DiscoverContent tools={tools} categories={categories} loadError={loadError} initialQuery={initialQuery} />
    </>
  )
}
