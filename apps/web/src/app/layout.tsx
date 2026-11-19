import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import DevhubAiSearch from '@/components/DevhubAiSearch'
import { cn } from '@/utils'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider, AuthProvider } from './providers'

import { rootMetadata, rootViewport } from '@/lib/seo/metadata'

export const metadata = rootMetadata
export const viewport = rootViewport

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('devlist-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}`,
          }}
        />
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'min-h-screen bg-canvas text-text font-mono',
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
              <DevhubAiSearch />
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
