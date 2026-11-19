import FavoritesAccessState from './FavoritesAccessState'
import FavoritesContent from './FavoritesContent'
import { createClient } from '@/lib/supabase/server'
import { toFavorite, type FavoriteRow } from '@/lib/supabase/mappers'
import type { Favorite } from '@/types'
import { type Metadata } from 'next'

export const metadata: Metadata = { title: 'Favorites' }

type FavoritesLoadResult =
  | { status: 'ok'; favorites: Favorite[] }
  | { status: 'invalid-session' }
  | { status: 'error' }

async function getFavorites(): Promise<FavoritesLoadResult> {
  try {
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) return { status: 'invalid-session' }
    const { data, error } = await supabase.from('favorites')
      .select('id,user_id,tool_id,tools(id,name,link,description,category_id)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    if (error) return { status: 'error' }
    return { status: 'ok', favorites: ((data ?? []) as FavoriteRow[]).map(toFavorite) }
  } catch (error) {
    console.error('Failed to fetch favorites', error)
    return { status: 'error' }
  }
}

export default async function Favorites() {
  const result = await getFavorites()
  if (result.status === 'invalid-session') {
    return <FavoritesAccessState state='signed-out' />
  }
  if (result.status === 'error') return <FavoritesAccessState state='load-error' />
  return <FavoritesContent initialFavorites={result.favorites} />
}
