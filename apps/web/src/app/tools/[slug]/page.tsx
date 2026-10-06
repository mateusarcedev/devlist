import CategoryToolsContent from './CategoryToolsContent'
import type { Tool } from '@/types'
import { getApiBaseUrl } from '@/utils'
import { type Metadata } from 'next'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const categoryName = decodeURIComponent(slug)

  return {
    title: `${categoryName} tools`,
    description: `Discover developer tools in the ${categoryName} category on Tools4.tech.`,
  }
}

interface CategoryToolsResult {
  tools: Tool[]
  loadError: boolean
}

async function getToolsByCategory(
  categoryName: string,
): Promise<CategoryToolsResult> {
  try {
    const baseUrl = getApiBaseUrl()
    if (!baseUrl) return { tools: [], loadError: true }

    const response = await fetch(
      `${baseUrl}/tools/category/${encodeURIComponent(categoryName)}`,
      { method: 'GET', cache: 'no-store' },
    )

    if (!response.ok) {
      return { tools: [], loadError: true }
    }

    return {
      tools: (await response.json()) as Tool[],
      loadError: false,
    }
  } catch (error) {
    console.error('Failed to load tools by category', error)
    return { tools: [], loadError: true }
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ToolsPage({ params }: PageProps) {
  const categoryName = decodeURIComponent((await params).slug)
  const result = await getToolsByCategory(categoryName)

  return (
    <CategoryToolsContent
      categoryName={categoryName}
      tools={result.tools}
      loadError={result.loadError}
    />
  )
}
