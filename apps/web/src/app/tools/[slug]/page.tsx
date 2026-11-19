import CategoryToolsContent from './CategoryToolsContent'
import type { Tool } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { toTool, type ToolRow } from '@/lib/supabase/mappers'
import { type Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoryName = decodeURIComponent((await params).slug)
  return {
    title: categoryName + ' tools',
    description: 'Discover tools in the ' + categoryName + ' category.',
  }
}

interface CategoryToolsResult {
  tools: Tool[]
  loadError: boolean
}

async function getToolsByCategory(name: string): Promise<CategoryToolsResult> {
  try {
    const supabase = await createClient()
    const category = await supabase.from('categories').select('id').eq('name', name).maybeSingle()
    if (category.error) return { tools: [], loadError: true }
    if (!category.data) return { tools: [], loadError: false }
    const result = await supabase.from('tools')
      .select('id,name,link,description,category_id')
      .eq('category_id', category.data.id)
      .order('name')
    if (result.error) return { tools: [], loadError: true }
    return { tools: ((result.data ?? []) as ToolRow[]).map(toTool), loadError: false }
  } catch (error) {
    console.error('Failed to load category from Supabase', error)
    return { tools: [], loadError: true }
  }
}

export default async function ToolsPage({ params }: PageProps) {
  const name = decodeURIComponent((await params).slug)
  const result = await getToolsByCategory(name)
  return (
    <CategoryToolsContent categoryName={name}
      tools={result.tools} loadError={result.loadError} />
  )
}
