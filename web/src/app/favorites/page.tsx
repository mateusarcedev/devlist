import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getApiBaseUrl } from '@/utils'
import type { Favorite } from '@/types'
import { type Metadata } from 'next'
import FavoritesContent from './FavoritesContent'

export const metadata: Metadata = {
  title: 'Favorites - Tools4.tech',
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

async function getFavorites(userId: number, token: string): Promise<Favorite[]> {
  try {
    const baseUrl = getApiBaseUrl()
    if (!baseUrl) return []

    const response = await fetch(`${baseUrl}/favorites/user/${userId}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) return []

    const data: Favorite[] = await response.json()
    return data
  } catch {
    return []
  }
}

export default async function Favorites() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) {
    return (
      <div className='flex flex-col justify-center items-center h-screen'>
        <h2 className='text-xl font-semibold mb-4'>You need to sign in first!</h2>
        <p className='text-gray-600'>Please log in to view your favorites.</p>
      </div>
    )
  }

  const userId = await getUserIdFromToken(token)

  if (!userId) {
    return (
      <div className='flex flex-col justify-center items-center h-screen'>
        <h2 className='text-xl font-semibold mb-4'>
          We couldn&apos;t load your favorites
        </h2>
        <p className='text-gray-600'>Try signing out and back in again.</p>
      </div>
    )
  }

  const favorites = await getFavorites(userId, token)

  return <FavoritesContent initialFavorites={favorites} />
}
