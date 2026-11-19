import { site } from '@/lib/seo/site'
import type { MetadataRoute } from 'next'

const disallow = ['/admin', '/admin/', '/api/', '/favorites', '/login', '/auth/']
const aiAgents = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: aiAgents, allow: ['/', '/llms.txt', '/llms-pt.txt'], disallow },
    ],
    sitemap: site.url + '/sitemap.xml',
    host: site.url,
  }
}
