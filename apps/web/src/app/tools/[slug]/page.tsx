import CategoryToolsContent from './CategoryToolsContent'
import type { Tool } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { loadVisibleTools } from '@/lib/catalog-tools'
import { type Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/metadata'
import { categoryJsonLd } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoryName = decodeURIComponent((await params).slug)
  return pageMetadata({
    title: categoryName + ' tools',
    description: 'Discover developer tools in the ' + categoryName + ' category, curated by the DevHub community.',
    path: `/tools/${encodeURIComponent(categoryName)}`,
  })
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
    const result = await loadVisibleTools(supabase, category.data.id)
    return { tools: result.tools, loadError: result.error }
  } catch (error) {
    console.error('Failed to load category from Supabase', error)
    return { tools: [], loadError: true }
  }
}

export default async function ToolsPage({ params }: PageProps) {
  const name = decodeURIComponent((await params).slug)
  const result = await getToolsByCategory(name)
  const seoTools = result.tools.map(tool=>({
    id:tool.id, name:tool.name, url:tool.link, description:tool.description,
    category: { id:tool.categoryId, name },
  }))
  return (
    <>
      {!result.loadError && seoTools.length>0 && <JsonLd data={categoryJsonLd(name,seoTools)} />}
      <CategoryToolsContent categoryName={name} tools={result.tools} loadError={result.loadError} />
    </>
  )
}
