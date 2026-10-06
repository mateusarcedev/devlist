'use client'

/* eslint-disable @next/next/no-img-element -- Tool favicons are remote site assets and intentionally remain unoptimized. */

import { useFavoriteToggle } from '@/hooks/useFavoriteToggle'
import type { Tool } from '@/types'
import { withReferral } from '@/lib/tool-url'
import { ExternalLink, Heart } from 'lucide-react'
import { Toast } from './Toast'

interface Props {
  tool: Tool
  categoryName?: string
}

function domainOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

export default function DirectoryToolCard({ tool, categoryName }: Props) {
  const { isFavorite, toast, setToast, toggle, isAuthLoading } =
    useFavoriteToggle(tool)

  const domain = domainOf(tool.link)
  const tags = categoryName ? [categoryName] : []
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`

  const handleFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    await toggle()
  }

  return (
    <>
      <a
        href={withReferral(tool.link)}
        target='_blank'
        rel='noopener noreferrer'
        className='group flex min-w-0 flex-col gap-2.5 rounded-[10px] border border-border bg-surface p-3.5 text-text transition-colors hover:border-zinc-700 hover:bg-[#0d0d10]'
      >
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <div className='relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-border-strong bg-surface-hover'>
              <img
                src={faviconUrl}
                alt=''
                className='h-5 w-5 object-contain'
                onError={event => {
                  event.currentTarget.style.display = 'none'
                  const fallback = event.currentTarget.nextElementSibling
                  if (fallback instanceof HTMLElement) {
                    fallback.style.display = 'flex'
                  }
                }}
              />
              <span className='hidden h-full w-full items-center justify-center font-mono text-sm font-semibold text-text'>
                {tool.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className='min-w-0'>
              <div className='truncate text-[14.5px] font-medium text-text'>
                {tool.name}
              </div>
              <div className='mt-px truncate font-mono text-[11.5px] text-subtle'>
                {domain}
              </div>
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-0.5'>
            <button
              type='button'
              onClick={handleFavorite}
              disabled={isAuthLoading}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className='flex h-7 w-7 items-center justify-center rounded-[6px] text-subtle transition-colors hover:bg-border hover:text-text disabled:cursor-wait disabled:opacity-50'
            >
              <Heart
                className={`h-[15px] w-[15px] ${isFavorite ? 'fill-accent text-accent' : ''}`}
              />
            </button>

            <span className='flex h-7 w-7 items-center justify-center text-faint transition-colors group-hover:text-subtle'>
              <ExternalLink className='h-[13px] w-[13px]' />
            </span>
          </div>
        </div>

        <p className='line-clamp-2 text-[13px] leading-[1.45] text-muted'>
          {tool.description}
        </p>

        {tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {tags.map(tag => (
              <span
                key={tag}
                className='rounded-[4px] border border-border-strong px-[7px] py-0.5 font-mono text-[10.5px] text-subtle'
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </a>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
