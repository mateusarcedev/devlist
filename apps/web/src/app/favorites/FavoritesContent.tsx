'use client'

import DirectoryToolCard from '@/components/DirectoryToolCard'
import { useI18n } from '@/contexts/i18n-context'
import type { Favorite } from '@/types'
import Link from 'next/link'
import { useState } from 'react'

interface Props { initialFavorites: Favorite[] }

export default function FavoritesContent({ initialFavorites }: Props) {
  const { t } = useI18n()
  const [favorites, setFavorites] = useState<Favorite[]>(initialFavorites ?? [])

  const handleFavoriteChange = (toolId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      setFavorites(previous => previous.filter(favorite => favorite.toolId !== toolId))
    }
  }

  return (
    <main className='mx-auto w-full max-w-[1240px] px-[clamp(16px,2.3vw,28px)] pb-20 pt-9'>
      <div className='mb-7 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='font-sans text-[28px] font-semibold tracking-[-0.025em] text-text'>{t('myFavorites')}</h1>
          <p className='mt-1 text-[13px] text-muted'>{favorites.length} {t('savedTools')}</p>
        </div>
        <Link href='/' className='inline-flex h-10 items-center rounded-[6px] border border-border-strong px-4 text-[12.5px] text-text hover:border-[var(--mint-edge)] hover:text-accent'>
          {t('discoverTools')}
        </Link>
      </div>
      {favorites.length === 0 ? (
        <div className='flex min-h-[230px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-strong px-6 py-12 text-center'>
          <h2 className='font-sans text-[16px] font-semibold text-text'>{t('favoriteEmptyHeading')}</h2>
          <p className='max-w-[420px] text-[12.5px] text-muted'>{t('favoriteEmptyDescription')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3'>
          {favorites.map(favorite => favorite.tool ? (
            <DirectoryToolCard
              key={favorite.id}
              tool={favorite.tool}
              initialIsFavorite
              onFavoriteChange={handleFavoriteChange}
            />
          ) : null)}
        </div>
      )}
    </main>
  )
}
