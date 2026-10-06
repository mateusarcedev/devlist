import FavoritesAccessState from './FavoritesAccessState'
import FavoritesContent from './FavoritesContent'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getApiBaseUrl } from '@/utils'
import type { Favorite } from '@/types'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Favorites',
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

async function getUserIdFromToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const sub = payload.sub

    if (typeof sub === 'number') return sub

    if (typeof sub === 'string') {
      const parsed = parseInt(sub, 10)
      return isNaN(parsed) ? null : parsed
    }

    return null
  } catch {
    return null
  }
}

type FavoritesLoadResult =
  | { status: 'ok'; favorites: Favorite[] }
  | { status: 'invalid-session' }
  | { status: 'error' }

async function getFavorites(
  userId: number,
  token: string,
): Promise<FavoritesLoadResult> {
  try {
    const baseUrl = getApiBaseUrl()
    if (!baseUrl) return { status: 'error' }

    const response = await fetch(`${baseUrl}/favorites/user/${userId}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401 || response.status === 403) {
      return { status: 'invalid-session' }
    }

    if (!response.ok) {
      return { status: 'error' }
    }

    return {
      status: 'ok',
      favorites: (await response.json()) as Favorite[],
    }
  } catch {
    return { status: 'error' }
  }
}

export default async function Favorites() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) {
    return <FavoritesAccessState state='signed-out' />
  }

  const userId = await getUserIdFromToken(token)

  if (!userId) {
    return <FavoritesAccessState state='invalid-session' />
  }

  const result = await getFavorites(userId, token)

  if (result.status === 'invalid-session') {
    return <FavoritesAccessState state='invalid-session' />
  }

  if (result.status === 'error') {
    return <FavoritesAccessState state='load-error' />
  }

  return <FavoritesContent initialFavorites={result.favorites} />
}
