import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://devlist.mateusarce.dev'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/favorites'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
