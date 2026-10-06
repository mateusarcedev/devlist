import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.tools4.tech'

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
