import { authOptions } from '@/lib/auth'
import FavoritesContent from './FavoritesContent'
import { getServerSession } from 'next-auth'
import { getApiBaseUrl } from '@/utils'
import getServerSessionToken from '@/utils/getServerSessionToken'

export const metadata = {
  title: 'Favorites - Tools4.tech',
}

async function getFavorites(userId, token) {
  if (!userId || !token) {
    return []
  }

  try {
    const baseUrl = getApiBaseUrl()

    if (!baseUrl) {
      return []
    }

    const response = await fetch(
      `${baseUrl}/favorites/user/${userId}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data
  } catch (error) {
    return []
  }
}

export default async function Favorites() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <div className='flex flex-col justify-center items-center h-screen'>
        <h2 className='text-xl font-semibold mb-4'>
          You need to sign in first!
        </h2>
        <p className='text-gray-600'>Please log in to view your favorites.</p>
      </div>
    )
  }

  const userId = session?.user?.githubId
  const token = getServerSessionToken()

  if (!userId || !token) {
    return (
      <div className='flex flex-col justify-center items-center h-screen'>
        <h2 className='text-xl font-semibold mb-4'>
          We couldn't load your favorites
        </h2>
        <p className='text-gray-600'>Try signing out and back in again.</p>
      </div>
    )
  }

  const favorites = await getFavorites(userId, token)

  return <FavoritesContent initialFavorites={favorites} />
}
