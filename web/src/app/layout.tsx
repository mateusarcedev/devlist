import Navbar from '@/components/Navbar'
import { cn } from '@/utils'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { type Session } from 'next-auth'
import { JetBrains_Mono } from 'next/font/google'
import { type Metadata, type Viewport } from 'next'
import './globals.css'
import { QueryProvider, SessionWrapper } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tools4.tech'),
  title: 'Tools4.tech - Essential Tools for Developers',
  description:
    'Find the best developer tools and accelerate your software development with carefully curated resources at Tools4.tech.',
  keywords:
    'developer tools, software development, programming resources, coding, technology',
  openGraph: {
    title: 'Tools4.tech - Essential Tools for Developers',
    description:
      'Discover essential programming tools and accelerate your software development at Tools4.tech.',
    url: 'https://www.tools4.tech/',
    siteName: 'Tools4.tech',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph.png',
        height: 630,
        alt: 'Tools4.tech - Developer Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tools4.tech - Essential Tools for Developers',
    description:
      'Discover essential programming tools and accelerate your software development at Tools4.tech.',
    images: ['/opengraph.png'],
  },
  robots: 'index, follow',
  authors: [{ name: 'Mateus Arce' }],
  alternates: {
    canonical: 'https://www.tools4.tech/',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700'],
  variable: '--font-jetbrains-mono',
})

interface RootLayoutProps {
  children: React.ReactNode
  session?: Session | null
}

export default function RootLayout({ children, session }: RootLayoutProps) {
  return (
    <html lang='en'>
      <body className={cn(jetbrainsMono.variable, 'bg-[#111111]')}>
        <SessionWrapper session={session}>
          <QueryProvider>
            <Navbar />
            {children}
            <Analytics />
            <SpeedInsights />
          </QueryProvider>
        </SessionWrapper>
      </body>
    </html>
  )
}
