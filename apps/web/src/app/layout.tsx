import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { cn } from '@/utils'
import { Geist_Mono, Inter } from 'next/font/google'
import { type Metadata, type Viewport } from 'next'
import './globals.css'
import { QueryProvider, AuthProvider } from './providers'

const siteUrl = 'https://devlist.mateusarce.dev'
const siteDescription =
  'Discover, save, and suggest useful developer tools in a community-driven catalog.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Devlist',
  manifest: '/manifest.webmanifest',
  title: {
    default: 'Devlist — Curated developer tools',
    template: '%s | Devlist',
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
  publisher: 'Devlist',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Devlist — Curated developer tools',
    description: siteDescription,
    url: '/',
    siteName: 'Devlist',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devlist — Curated developer tools',
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
  themeColor: '#000000',
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body
        className={cn(
          inter.variable,
          geistMono.variable,
          'min-h-screen bg-canvas text-text font-sans',
        )}
      >
        <AuthProvider>
          <QueryProvider>
            <a
              href='#main-content'
              className='fixed left-4 top-4 z-[300] -translate-y-24 rounded-[6px] bg-white px-3 py-2 text-sm font-medium text-black transition-transform focus:translate-y-0'
            >
              Skip to content
            </a>
            <div className='flex min-h-screen flex-col'>
              <Navbar />
              <div id='main-content' tabIndex={-1} className='flex-1 outline-none'>
                {children}
              </div>
              <Footer />
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
