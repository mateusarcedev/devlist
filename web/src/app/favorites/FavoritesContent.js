'use client'

import Card from '@/components/Card'
import { useState } from 'react'

export default function FavoritesContent({ initialFavorites }) {
  const [favorites, setFavorites] = useState(initialFavorites ?? [])

  const handleFavoriteChange = (toolId, isFavorite) => {
    if (!isFavorite) {
      setFavorites(prev => prev.filter(favorite => favorite.toolId !== toolId))
    }
  }

  if (!favorites.length) {
    return (
      <div className='flex flex-col justify-center items-center h-screen'>
        <h2 className='text-xl font-semibold mb-4'>No favorites found</h2>
        <p className='text-gray-600'>
          You haven't added any tools to your favorites yet.
        </p>
      </div>
    )
  }

  return (
    <div className='w-4/5 mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6'>My Favorites</h1>
      <div className='grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-5 gap-5'>
        {favorites.map(favorite => (
          <div key={favorite.id}>
            <Card
              tool={favorite.tool}
              initialIsFavorite
              onFavoriteChange={handleFavoriteChange}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
