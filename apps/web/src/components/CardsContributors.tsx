'use client'

import {
  filterAndSortContributors,
  type ContributorSortKey,
} from '@/lib/contributors'
import type { Contributor } from '@/types'
import { Search } from 'lucide-react'
import { useState } from 'react'

interface Props {
  data: Contributor[]
}

function initials(login: string) {
  const parts = login
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .slice(0, 2)

  return parts.map(part => part.charAt(0).toUpperCase()).join('') || '?'
}

export default function CardsContributors({ data }: Props) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<ContributorSortKey>('contributions')

  const filteredAndSortedContributors = filterAndSortContributors(
    data,
    search,
    sortBy,
  )

  return (
    <>
      <div className='mb-6 flex flex-wrap gap-2.5'>
        <div className='relative min-w-[200px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-faint' />
          <input
            type='search'
            placeholder='Search contributors'
            aria-label='Search contributors'
            value={search}
            onChange={event => setSearch(event.target.value)}
            className='dl-control h-[42px] w-full pl-9 pr-3 text-sm outline-none focus:border-zinc-600'
          />
        </div>

        <select
          value={sortBy}
          onChange={event =>
            setSortBy(event.target.value as ContributorSortKey)
          }
          aria-label='Sort contributors'
          className='dl-control h-[42px] min-w-[180px] px-3 text-sm outline-none [color-scheme:dark] focus:border-zinc-600'
        >
          <option value='contributions'>Most contributions</option>
          <option value='followers'>Most followers</option>
          <option value='name'>Name</option>
        </select>
      </div>

      {filteredAndSortedContributors.length === 0 ? (
        <div className='border-t border-border px-4 py-16 text-center'>
          <div className='mb-1.5 text-[15px] font-medium text-text'>
            No contributors found
          </div>
          <div className='text-[13px] text-subtle'>
            No one matches &quot;{search.trim()}&quot;.
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5'>
          {filteredAndSortedContributors.map(contributor => (
            <a
              key={contributor.login}
              href={`https://github.com/${contributor.login}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex flex-col items-center gap-2 rounded-[8px] border border-border px-3 py-[18px] text-center text-text transition-colors hover:border-zinc-700 hover:bg-surface'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-border font-mono text-xs font-semibold text-text'>
                {initials(contributor.login)}
              </div>
              <div className='max-w-full truncate font-mono text-[13px] font-medium'>
                {contributor.login}
              </div>
              <div className='flex flex-wrap items-center justify-center gap-2 text-[11px] text-subtle'>
                <span>
                  {contributor.contributions} commit
                  {contributor.contributions === 1 ? '' : 's'}
                </span>
                <span aria-hidden='true'>·</span>
                <span>
                  {contributor.followers ?? 0} follower
                  {(contributor.followers ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
