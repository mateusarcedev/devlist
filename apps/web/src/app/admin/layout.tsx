import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { noIndex } from '@/lib/seo/metadata'

export const metadata: Metadata = { title: 'Admin', ...noIndex }

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}
