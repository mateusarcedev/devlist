'use client'

import DirectoryToolCard from '@/components/DirectoryToolCard'
import type { Favorite } from '@/types'
import Link from 'next/link'
import { useState } from 'react'

interface Props {
  initialFavorites: Favorite[]
}

export default function FavoritesContent({ initialFavorites }: Props) {
  const [favorites, setFavorites] = useState<Favorite[]>(initialFavorites ?? [])

  const handleFavoriteChange = (toolId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      setFavorites(previous =>
        previous.filter(favorite => favorite.toolId !== toolId),
      )
    }
  }

  return (
    <main className='dl-page'>
      <h1 className='text-2xl font-semibold tracking-[-0.01em] text-white'>
        My favorites
      </h1>
      <div className='mb-6 mt-1 text-[13px] text-subtle'>
        {favorites.length} saved tool{favorites.length === 1 ? '' : 's'}
      </div>

      {favorites.length === 0 ? (
        <div className='border-t border-border px-4 py-16 text-center'>
          <div className='mb-1.5 text-[15px] font-medium text-text'>
            No favorites yet
          </div>
          <p className='mb-5 text-[13px] text-subtle'>
            Save tools you want to come back to.
          </p>
          <Link
            href='/'
            className='inline-flex rounded-[6px] bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
          >
            Discover tools
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
          {favorites.map(favorite =>
            favorite.tool ? (
              <DirectoryToolCard
                key={favorite.id}
                tool={favorite.tool}
                initialIsFavorite
                onFavoriteChange={handleFavoriteChange}
              />
            ) : null,
          )}
        </div>
      )}
    </main>
  )
}
