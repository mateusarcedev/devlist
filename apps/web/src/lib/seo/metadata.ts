import type { Metadata, Viewport } from 'next'
import { site } from './site'

export const rootMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ['developer tools','open source','free developer tools','DevOps','frontend','APIs','software development'],
  authors: [{ name: site.author.name, url: site.author.url }],
  creator: site.author.name,
  publisher: site.name,
  category: 'technology',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: '/',
    locale: site.locale,
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
}

export const rootViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: site.themeColor.dark },
    { media: '(prefers-color-scheme: light)', color: site.themeColor.light },
  ],
}

interface PageMetaInput { title: string; description: string; path: `/${string}` }

export function pageMetadata({ title, description, path }: PageMetaInput): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${site.name}`, description, url: path },
    twitter: { title: `${title} · ${site.name}`, description },
  }
}

export const noIndex: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}
