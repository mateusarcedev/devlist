import { siteUrl } from '@/lib/site-config'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl

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
