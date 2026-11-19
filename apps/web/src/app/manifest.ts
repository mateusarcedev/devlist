import type { MetadataRoute } from 'next'
import { site } from '@/lib/seo/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.title,
    short_name: site.name,
    description: site.description,
    lang: site.language,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: site.themeColor.dark,
    theme_color: site.themeColor.dark,
    categories: ['developer','productivity','utilities'],
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
    ],
  }
}
