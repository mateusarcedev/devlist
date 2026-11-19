import type { MetadataRoute } from 'next'
import { getSeoTools, groupByCategory } from '@/lib/seo/data'
import { absoluteUrl } from '@/lib/seo/site'

export const revalidate = 3600

/** Index real public category routes: /tools/[name], not the non-existent /c/[slug]. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tools = await getSeoTools()
  const categories = groupByCategory(tools)
  const latest = (dates: (string | undefined)[]): Date | undefined => {
    const times = dates.map(value => value ? Date.parse(value) : NaN).filter(Number.isFinite)
    return times.length ? new Date(Math.max(...times)) : undefined
  }
  const updated = latest(tools.map(tool => tool.createdAt))
  return [
    { url: absoluteUrl('/'), ...(updated ? {lastModified:updated} : {}), changeFrequency:'daily', priority:1 },
    { url: absoluteUrl('/contributors'), changeFrequency:'weekly', priority:0.6 },
    ...[...categories.entries()].map(([name,list])=>({
      url: absoluteUrl('/tools/'+encodeURIComponent(name)),
      ...(latest(list.map(tool=>tool.createdAt)) ? {lastModified:latest(list.map(tool=>tool.createdAt))} : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
