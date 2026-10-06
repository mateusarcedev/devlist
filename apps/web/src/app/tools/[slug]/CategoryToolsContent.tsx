'use client'

import DirectoryToolCard from '@/components/DirectoryToolCard'
import type { Tool } from '@/types'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  categoryName: string
  tools: Tool[]
  loadError?: boolean
}

function domainOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

export default function CategoryToolsContent({
  categoryName,
  tools,
  loadError = false,
}: Props) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return tools

    return tools.filter(tool =>
      [tool.name, tool.description, domainOf(tool.link)].some(value =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [query, tools])

  const hasSearch = Boolean(query.trim())

  return (
    <main className='dl-page'>
      <Link
        href='/'
        className='mb-5 inline-flex items-center gap-1.5 text-[13px] text-subtle transition-colors hover:text-text'
      >
        <ArrowLeft className='h-3.5 w-3.5' />
        All categories
      </Link>

      <h1 className='text-2xl font-semibold tracking-[-0.01em] text-white'>
        {categoryName}
      </h1>
      <div className='mb-6 mt-1 text-[13px] text-subtle'>
        {tools.length} tool{tools.length === 1 ? '' : 's'}
      </div>

      {!loadError && tools.length > 0 && (
        <div className='relative mb-6'>
          <Search className='pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-faint' />
          <input
            type='search'
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={`Search ${categoryName} tools...`}
            aria-label={`Search ${categoryName} tools`}
            className='dl-control h-[42px] w-full pl-[38px] pr-3.5 font-mono text-sm outline-none focus:border-zinc-600'
          />
        </div>
      )}

      {loadError ? (
        <div className='border-t border-border px-4 py-16 text-center'>
          <div className='mb-1.5 text-[15px] font-medium text-text'>
            Something went wrong while fetching tools.
          </div>
          <p className='mb-5 text-[13px] text-subtle'>
            Try loading this category again.
          </p>
          <button
            type='button'
            onClick={() => router.refresh()}
            className='rounded-[6px] bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
          >
            Try again
          </button>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className='border-t border-border px-4 py-16 text-center'>
          <div className='mb-1.5 text-[15px] font-medium text-text'>
            {hasSearch
              ? 'No tools match your search'
              : 'No tools in this category yet'}
          </div>
          <p className='text-[13px] text-subtle'>
            {hasSearch ? 'Try a different search term.' : 'Be the first to suggest one.'}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
          {filteredTools.map(tool => (
            <DirectoryToolCard
              key={tool.id}
              tool={tool}
              categoryName={categoryName}
            />
          ))}
        </div>
      )}
    </main>
  )
}
