import DiscoverContent from '@/components/DiscoverContent'
import type { Category, Tool } from '@/types'
import { getApiBaseUrl } from '@/utils'

interface DirectoryData {
  tools: Tool[]
  categories: Category[]
  loadError: boolean
}

async function getDirectoryData(): Promise<DirectoryData> {
  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl) {
    return { tools: [], categories: [], loadError: true }
  }

  try {
    const [toolsResponse, categoriesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/tools`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/categories`, { cache: 'no-store' }),
    ])

    if (!toolsResponse.ok || !categoriesResponse.ok) {
      return { tools: [], categories: [], loadError: true }
    }

    const [tools, categories] = await Promise.all([
      toolsResponse.json() as Promise<Tool[]>,
      categoriesResponse.json() as Promise<Category[]>,
    ])

    return { tools, categories, loadError: false }
  } catch (error) {
    console.error('Failed to load discovery directory', error)
    return { tools: [], categories: [], loadError: true }
  }
}

export default async function Home() {
  const { tools, categories, loadError } = await getDirectoryData()

  return (
    <DiscoverContent
      tools={tools}
      categories={categories}
      loadError={loadError}
    />
  )
}
