import type { MetadataRoute } from 'next'
import { siteName, siteTitle } from '@/lib/site-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteTitle,
    short_name: siteName,
    description:
      'Discover, save, and suggest useful developer tools in a community-driven catalog.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
