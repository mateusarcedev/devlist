import { cache } from 'react'

/** Supabase public Data API is the source of truth (not the legacy NestJS API in the ZIP). */
export interface SeoTool {
  id: string
  name: string
  url: string
  description: string
  category: { id: string; name: string }
  createdAt?: string
}

interface DbTool {
  id: string
  name: string
  link: string
  description: string
  category_id: string
  created_at?: string
}
interface DbCategory { id: string; name: string }

export interface SeoContributor { login: string; avatarUrl?: string; approvedCount: number }

const cacheSeconds = 3600

async function getPublicRows<T>(table: string, columns: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return []
  try {
    const params = new URLSearchParams({ select: columns, limit: '1000' })
    const response = await fetch(`${url}/rest/v1/${table}?${params.toString()}`, {
      headers: { apikey: key, Accept: 'application/json' },
      next: { revalidate: cacheSeconds, tags: ['devhub-seo'] },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []
    const value: unknown = await response.json()
    return Array.isArray(value) ? value as T[] : []
  } catch {
    // SEO endpoints remain available when Supabase temporarily fails.
    return []
  }
}

/** Shared for sitemap, schema.org, llms.txt and OG. Never expose paid tools. */
export const getSeoTools = cache(async (): Promise<SeoTool[]> => {
  const [tools, categories] = await Promise.all([
    getPublicRows<DbTool>('tools', 'id,name,link,description,category_id,created_at'),
    getPublicRows<DbCategory>('categories', 'id,name'),
  ])
  const categoryById = new Map(categories.map(item => [item.id, item.name]))
  return tools
    .filter(item => categoryById.has(item.category_id) && /^https?:\/\//i.test(item.link))
    .map(item => ({
      id: item.id,
      name: item.name,
      url: item.link,
      description: item.description,
      category: { id: item.category_id, name: categoryById.get(item.category_id)! },
      createdAt: item.created_at,
    }))
    .sort((a,b) => a.name.localeCompare(b.name,'en'))
})

export function groupByCategory(tools: SeoTool[], locale = 'en'): Map<string, SeoTool[]> {
  const groups = new Map<string, SeoTool[]>()
  for (const tool of tools) {
    const name = tool.category.name
    groups.set(name,[...(groups.get(name) ?? []),tool])
  }
  for (const list of groups.values()) list.sort((a,b) => a.name.localeCompare(b.name,locale))
  return new Map([...groups.entries()].sort(([a],[b]) => a.localeCompare(b,locale)))
}
