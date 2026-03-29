'use client'

import type { Contributor } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

interface Props {
  data: Contributor[]
}

type SortKey = 'contributions' | 'followers' | 'name'

export default function CardsContributors({ data }: Props) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('contributions')
  const MotionLink = motion(Link)

  const filteredAndSortedContributors = data
    .filter(contributor =>
      contributor.login.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'contributions':
          return b.contributions - a.contributions
        case 'followers':
          return (b.followers ?? 0) - (a.followers ?? 0)
        case 'name':
          return a.login.localeCompare(b.login)
        default:
          return 0
      }
    })

  return (
    <>
      <div className='flex flex-col sm:flex-row gap-4 w-full max-w-2xl mx-auto mb-8'>
        <input
          type='search'
          placeholder='Search contributors...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='flex-1 p-2 rounded-lg bg-[#222] text-white focus:outline-hidden focus:ring-2 focus:ring-gray-600'
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className='p-2 rounded-lg bg-[#222] text-white focus:outline-hidden focus:ring-2 focus:ring-gray-600'
        >
          <option value='contributions'>Most contributions</option>
          <option value='followers'>Most followers</option>
          <option value='name'>Name</option>
        </select>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        <AnimatePresence mode='popLayout'>
          {filteredAndSortedContributors.length > 0 ? (
            filteredAndSortedContributors.map((contributor, index) => (
              <MotionLink
                href={`https://github.com/${contributor.login}`}
                key={contributor.login}
                target='_blank'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className='p-4 rounded-lg bg-[#222] hover:bg-[#333] transition-all duration-300 flex flex-col items-center'
              >
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className='w-16 h-16 rounded-full border-2 border-transparent hover:border-white'
                />
                <span className='mt-3 text-sm font-medium text-white'>
                  {contributor.login}
                </span>
                <div className='mt-2 text-xs text-gray-400'>
                  Contributions: {contributor.contributions}
                </div>
                <div className='mt-2 text-xs text-gray-400'>
                  Followers: {contributor.followers}
                </div>
              </MotionLink>
            ))
          ) : (
            <div className='col-span-full text-center py-8'>
              <p className='text-gray-400'>
                No contributors found matching your search.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
