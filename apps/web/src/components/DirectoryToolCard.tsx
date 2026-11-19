'use client'

/* eslint-disable @next/next/no-img-element -- Tool favicons are remote site assets and intentionally remain unoptimized. */

import { useFavoriteToggle } from '@/hooks/useFavoriteToggle'
import { useI18n } from '@/contexts/i18n-context'
import type { OnFavoriteChange, Tool } from '@/types'
import { withReferral } from '@/lib/tool-url'
import { ArrowUpRight, Heart } from 'lucide-react'
import { memo } from 'react'
import { Toast } from './Toast'

interface Props {
  tool: Tool
  categoryName?: string
  initialIsFavorite?: boolean
  onFavoriteChange?: OnFavoriteChange
}

function getDomain(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

function DirectoryToolCard({
  tool,
  categoryName,
  initialIsFavorite = false,
  onFavoriteChange,
}: Props) {
  const { t } = useI18n()
  const { isFavorite, toast, setToast, toggle, isAuthLoading } =
    useFavoriteToggle(tool, initialIsFavorite)
  const domain = getDomain(tool.link)
  const faviconUrl = 'https://www.google.com/s2/favicons?sz=128&domain=' + encodeURIComponent(domain)

  const handleFavorite = async () => {
    await toggle(onFavoriteChange)
  }

  return (
    <>
      <article className='dh-tool-card group flex min-h-[176px] min-w-0 flex-col gap-3 rounded-[10px] border border-border-strong bg-surface p-[18px] text-text'>
        <div className='flex items-start gap-3'>
          <span
            aria-hidden='true'
            className='dh-tool-mark relative grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[8px] border border-border-strong bg-surface-hover font-sans text-[15px] font-semibold text-text'
          >
            {tool.name.charAt(0).toLocaleUpperCase()}
            <img
              src={faviconUrl}
              loading='lazy'
              decoding='async'
              alt=''
              className='absolute inset-0 m-auto h-5 w-5 object-contain'
              onError={event => { event.currentTarget.style.display = 'none' }}
            />
          </span>
          <div className='min-w-0 flex-1'>
            <h3 title={tool.name} className='truncate font-sans text-[15px] font-semibold tracking-[-0.01em] text-text'>{tool.name}</h3>
            <p title={domain} className='truncate text-[11.5px] text-subtle'>{domain}</p>
          </div>
          <button
            type='button'
            onClick={handleFavorite}
            disabled={isAuthLoading}
            aria-pressed={isFavorite}
            aria-label={(isFavorite ? t('removeFavorite') : t('saveFavorite')).replace('{name}', tool.name)}
            className={'-mr-1.5 -mt-1.5 grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[6px] transition-colors disabled:cursor-wait disabled:opacity-50 ' +
              (isFavorite
                ? 'bg-[var(--mint-dim)] text-accent'
                : 'text-subtle hover:bg-[var(--mint-dim)] hover:text-accent')}
          >
            <Heart aria-hidden='true' strokeWidth={1.6} className={'h-4 w-4 ' + (isFavorite ? 'fill-current' : '')} />
          </button>
        </div>

        <p className='min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere] text-[13px] leading-[1.6] text-muted'>
          {tool.description}
        </p>

        <div className='flex items-center justify-between gap-2'>
          {categoryName
            ? <span title={categoryName} className='min-w-0 truncate rounded-full border border-border-strong px-2 py-[3px] text-[10.5px] text-muted'>{categoryName}</span>
            : <span />}
          <a
            href={withReferral(tool.link)}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={t('visit') + ' ' + tool.name}
            className='inline-flex shrink-0 items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-accent'
          >
            {t('visit')}
            <ArrowUpRight aria-hidden='true' strokeWidth={2} className='h-3 w-3' />
          </a>
        </div>
      </article>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

export default memo(DirectoryToolCard)
