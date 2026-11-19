import AdminCatalog from '@/components/AdminCatalog'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · Revisão do catálogo', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function CatalogReviewPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') redirect('/')
  return <AdminCatalog />
}
