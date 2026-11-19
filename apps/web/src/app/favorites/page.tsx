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
    const read = (withAccess: boolean) => supabase.from('favorites')
      .select('id,user_id,tool_id,tools(id,name,link,description,category_id' + (withAccess ? ',access_model' : '') + ')')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    let result = await read(true)
    if (result.error && /access_model/i.test(result.error.message)) result = await read(false)
    if (result.error) return { status: 'error' }
    return { status: 'ok', favorites: ((result.data ?? []) as FavoriteRow[]).map(toFavorite).filter(f => f.tool?.accessModel !== 'PAID') }
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
