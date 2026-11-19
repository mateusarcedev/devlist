import DiscoverContent from '@/components/DiscoverContent'
import type { Category, Tool } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { toCategory, toTool, type ToolRow } from '@/lib/supabase/mappers'

interface DirectoryData {
  tools: Tool[]
  categories: Category[]
  loadError: boolean
}

async function getDirectoryData(): Promise<DirectoryData> {
  try {
    const supabase = await createClient()
    const [toolsResult, categoriesResult] = await Promise.all([
      supabase.from('tools').select('id,name,link,description,category_id').order('name'),
      supabase.from('categories').select('id,name').order('name'),
    ])
    if (toolsResult.error || categoriesResult.error) {
      return { tools: [], categories: [], loadError: true }
    }
    return {
      tools: ((toolsResult.data ?? []) as ToolRow[]).map(toTool),
      categories: (categoriesResult.data ?? []).map(toCategory),
      loadError: false,
    }
  } catch (error) {
    console.error('Failed to load Supabase catalog', error)
    return { tools: [], categories: [], loadError: true }
  }
}

export default async function Home() {
  const { tools, categories, loadError } = await getDirectoryData()
  return <DiscoverContent tools={tools} categories={categories} loadError={loadError} />
}
