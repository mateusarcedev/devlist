import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://devlist.mateusarce.dev'

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
