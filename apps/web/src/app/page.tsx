import DiscoverContent from '@/components/DiscoverContent'
import type { Category, Tool } from '@/types'
import { getApiBaseUrl } from '@/utils'

async function getDirectoryData(): Promise<{
  tools: Tool[]
  categories: Category[]
}> {
  const apiBaseUrl = getApiBaseUrl()

  try {
    const [toolsResponse, categoriesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/tools`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/categories`, { cache: 'no-store' }),
    ])

    if (!toolsResponse.ok || !categoriesResponse.ok) {
      return { tools: [], categories: [] }
    }

    const [tools, categories] = await Promise.all([
      toolsResponse.json() as Promise<Tool[]>,
      categoriesResponse.json() as Promise<Category[]>,
    ])

    return { tools, categories }
  } catch (error) {
    console.error('Failed to load discovery directory', error)
    return { tools: [], categories: [] }
  }
}

export default async function Home() {
  const { tools, categories } = await getDirectoryData()

  return <DiscoverContent tools={tools} categories={categories} />
}
