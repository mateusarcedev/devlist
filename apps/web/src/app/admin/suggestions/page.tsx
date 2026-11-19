import { createClient } from '@/lib/supabase/server'
import AdminSuggestions from '@/components/AdminSuggestions'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title:'Admin · Sugestões', robots:{index:false,follow:false} }
export const dynamic = 'force-dynamic'

export default async function SuggestionsPage() {
  const db = await createClient()
  const { data:{ user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await db.from('profiles').select('role').eq('id',user.id).single()
  if (profile?.role !== 'ADMIN') redirect('/')
  const { data: categories } = await db.from('categories').select('id,name').order('name')
  return <AdminSuggestions categories={categories ?? []} />
}
