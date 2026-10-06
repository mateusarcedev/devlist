import Navbar from '@/components/Navbar'
import { cn } from '@/utils'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { JetBrains_Mono } from 'next/font/google'
import { type Metadata, type Viewport } from 'next'
import './globals.css'
import { QueryProvider, AuthProvider } from './providers'

const siteUrl = 'https://www.tools4.tech'
const siteDescription =
  'Discover, save, and suggest useful developer tools in a community-driven catalog.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Tools4.tech',
  title: {
    default: 'Tools4.tech — Curated developer tools',
    template: '%s | Tools4.tech',
  },
  description: siteDescription,
  keywords: [
    'developer tools',
    'programming tools',
    'software development',
    'developer resources',
    'open source tools',
    'coding tools',
  ],
  authors: [{ name: 'Mateus Arce' }],
  creator: 'Mateus Arce',
  publisher: 'Tools4.tech',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Tools4.tech — Curated developer tools',
    description: siteDescription,
    url: '/',
    siteName: 'Tools4.tech',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tools4.tech — Curated developer tools',
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111111',
}

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700'],
  variable: '--font-jetbrains-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={cn(jetbrainsMono.variable, 'bg-[#111111]')}>
        <AuthProvider>
          <QueryProvider>
            <Navbar />
            {children}
            <Analytics />
            <SpeedInsights />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
