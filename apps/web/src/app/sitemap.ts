import { siteUrl } from '@/lib/site-config'
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl

  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/contributors`,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
