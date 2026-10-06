'use client'

import DirectoryToolCard from '@/components/DirectoryToolCard'
import type { Category, Tool } from '@/types'
import { Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FaGithub } from 'react-icons/fa'

interface Props {
  tools: Tool[]
  categories: Category[]
  loadError?: boolean
}

export default function DiscoverContent({
  tools,
  categories,
  loadError = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const router = useRouter()

  const categoriesById = useMemo(
    () => new Map(categories.map(category => [category.id, category.name])),
    [categories],
  )

  const visibleTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return tools.filter(tool => {
      if (activeCategory !== 'all' && tool.categoryId !== activeCategory) {
        return false
      }

      if (!normalizedQuery) return true

      const categoryName = categoriesById.get(tool.categoryId) ?? ''
      let domain = ''

      try {
        domain = new URL(tool.link).hostname.replace(/^www\./, '')
      } catch {
        domain = tool.link
      }

      return [tool.name, tool.description, categoryName, domain].some(value =>
        value.toLowerCase().includes(normalizedQuery),
      )
    })
  }, [activeCategory, categoriesById, query, tools])

  const selectedCategory = categories.find(
    category => category.id === activeCategory,
  )

  const resultsLabel =
    activeCategory === 'all' && !query.trim()
      ? 'All tools'
      : `${visibleTools.length} result${visibleTools.length === 1 ? '' : 's'}`

  return (
    <main className='dl-page'>
      <div className='mb-5'>
        <h1 className='text-2xl font-semibold tracking-[-0.01em] text-white'>
          Discover tools
        </h1>
        <p className='mt-1 text-sm text-subtle'>
          Community-curated developer tools.
        </p>
      </div>

      {!loadError && (
        <>
          <div className='relative mb-4'>
            <Search className='pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-faint' />
            <input
              type='search'
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder='Search tools, categories, technologies...'
              aria-label='Search tools'
              className='dl-control h-[42px] w-full pl-[38px] pr-3.5 font-mono text-sm outline-none focus:border-zinc-600'
            />
          </div>

          <div className='mb-7 flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setActiveCategory('all')}
              aria-pressed={activeCategory === 'all'}
              className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'border-white bg-white text-black'
                  : 'border-border-strong bg-transparent text-muted hover:border-zinc-600 hover:text-text'
              }`}
            >
              All
            </button>

            {categories.map(category => (
              <button
                type='button'
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
                className={`rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'border-white bg-white text-black'
                    : 'border-border-strong bg-transparent text-muted hover:border-zinc-600 hover:text-text'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <Link
              href={`/tools/${encodeURIComponent(selectedCategory.name)}`}
              className='mb-6 -mt-3 inline-flex text-[12.5px] text-subtle transition-colors hover:text-text'
            >
              View {selectedCategory.name} as a full category page →
            </Link>
          )}

          <section className='mb-8 flex flex-wrap items-center gap-x-7 gap-y-4 rounded-[10px] border border-border px-5 py-4'>
            <div className='min-w-[180px] flex-1'>
              <div className='mb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-accent'>
                Community maintained
              </div>
              <div className='text-[13px] text-muted'>
                Built and maintained with contributions from developers.
              </div>
            </div>

            <Link
              href='https://github.com/mateusarcedev/devlist'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-text'
            >
              <FaGithub className='h-[15px] w-[15px]' />
              GitHub repository →
            </Link>

            <Link
              href='/contributors'
              className='flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-text'
            >
              <Users className='h-[15px] w-[15px]' />
              Contributors →
            </Link>
          </section>
        </>
      )}

      {loadError ? (
        <div className='border-t border-border px-4 py-16 text-center'>
          <div className='mb-1.5 text-[15px] font-medium text-text'>
            We couldn&apos;t load the directory
          </div>
          <p className='mb-5 text-[13px] text-subtle'>
            The catalog is temporarily unavailable.
          </p>
          <button
            type='button'
            onClick={() => router.refresh()}
            className='rounded-[6px] bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div
            aria-live='polite'
            className='mb-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-subtle'
          >
            {resultsLabel}
          </div>

          {visibleTools.length === 0 ? (
            <div className='border-t border-border px-4 py-16 text-center'>
              <div className='mb-1.5 text-[15px] font-medium text-text'>
                No tools match
              </div>
              <div className='text-[13px] text-subtle'>
                Try a different search or category.
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
              {visibleTools.map(tool => (
                <DirectoryToolCard
                  key={tool.id}
                  tool={tool}
                  categoryName={categoriesById.get(tool.categoryId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
