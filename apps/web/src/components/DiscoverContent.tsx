'use client'

import DirectoryToolCard from '@/components/DirectoryToolCard'
import DevhubAiSearch from '@/components/DevhubAiSearch'
import { useI18n } from '@/contexts/i18n-context'
import { getCategoryLabel } from '@/lib/category-labels'
import { requestSuggestionModal } from '@/lib/suggestion-trigger'
import type { Category, Tool } from '@/types'
import { Search, ArrowUpRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 24

interface Props {
  tools: Tool[]
  categories: Category[]
  loadError?: boolean
}

function getDomain(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

export default function DiscoverContent({
  tools,
  categories,
  loadError = false,
}: Props) {
  const { locale, t } = useI18n()
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const categoryLabels = useMemo(
    () => new Map(categories.map(category => [
      category.id,
      getCategoryLabel(category.name, locale),
    ])),
    [categories, locale],
  )

  const visibleTools = useMemo(() => {
    const term = query.trim().toLocaleLowerCase(locale)
    return tools.filter(tool => {
      if (activeCategory !== 'all' && tool.categoryId !== activeCategory) return false
      if (!term) return true

      const rawCategory = categories.find(category => category.id === tool.categoryId)?.name ?? ''
      const haystack = [
        tool.name,
        tool.description,
        getDomain(tool.link),
        rawCategory,
        categoryLabels.get(tool.categoryId) ?? '',
      ]
      return haystack.some(item => item.toLocaleLowerCase(locale).includes(term))
    })
  }, [activeCategory, categories, categoryLabels, locale, query, tools])

  const selectedCategory = categories.find(category => category.id === activeCategory)
  const isFiltered = activeCategory !== 'all' || query.trim().length > 0
  // Preserve the performant 24-card initial render from PR #59.
  // Filtered subsets are shown completely, as in Main.dc.html.
  const displayedTools = isFiltered ? visibleTools : visibleTools.slice(0, visibleCount)
  const hasMore = !isFiltered && visibleCount < visibleTools.length
  const heading = selectedCategory
    ? categoryLabels.get(selectedCategory.id) ?? selectedCategory.name
    : t('allTools')
  const resultLabel = isFiltered
    ? visibleTools.length + ' ' + (visibleTools.length === 1 ? t('resultSingle') : t('resultPlural'))
    : tools.length + ' ' + t('inCatalog')

  const emptyState = (title: string, message: string, retry = false) => (
    <div className='flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-strong px-6 py-12 text-center'>
      <h3 className='font-sans text-[16px] font-semibold text-text'>{title}</h3>
      <p className='max-w-[420px] text-[12.5px] text-muted'>{message}</p>
      <button
        type='button'
        onClick={retry ? () => router.refresh() : requestSuggestionModal}
        className='mt-2 inline-flex h-10 items-center rounded-[6px] border border-border-strong px-4 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
      >
        {retry ? t('retry') : t('suggestOne')}
      </button>
    </div>
  )

  return (
    <main className='mx-auto w-full max-w-[1600px] px-[clamp(16px,2.3vw,28px)]'>
      <section className='flex flex-col gap-[18px] pb-5 pt-7 tablet:pb-7 tablet:pt-9'>
        <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
          <div>
            <h1 className='font-sans text-[25px] font-semibold leading-[1.2] tracking-[-0.025em] text-text tablet:text-[28px]'>
              {t('discoverHeading')}
            </h1>
            <p className='mt-1 text-[13px] text-muted'>{t('discoverDescription')}</p>
          </div>
          {!loadError && (
            <span className='text-[12px] text-subtle'>
              {tools.length} {t('toolsCount')} · {categories.length} {t('categoriesCount')}
            </span>
          )}
        </div>

        {!loadError && (
          <form
            role='search'
            onSubmit={event => event.preventDefault()}
            className='flex h-12 items-center gap-3 rounded-[10px] border border-border-strong bg-surface px-4 transition-[border-color,box-shadow] focus-within:border-[var(--mint-edge)] focus-within:shadow-[0_0_0_4px_var(--mint-dim)]'
          >
            <Search aria-hidden='true' className='h-[17px] w-[17px] shrink-0 text-subtle' strokeWidth={1.7} />
            <label className='sr-only' htmlFor='devhub-catalog-search'>{t('searchLabel')}</label>
            <input
              id='devhub-catalog-search'
              ref={searchRef}
              type='search'
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
              placeholder={t('searchTools')}
              aria-label={t('searchTools')}
              aria-keyshortcuts='Meta+K Control+K'
              className='h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-text outline-none placeholder:text-subtle'
            />
            <kbd className='hidden shrink-0 rounded-[6px] border border-border-strong bg-surface-hover px-2 py-[3px] font-mono text-[11px] text-muted tablet:block'>
              ⌘ K
            </kbd>
          </form>
        )}
        {!loadError && <DevhubAiSearch />}
      </section>

      <section id='catalogo' className='flex flex-col gap-5 pb-12 pt-2 laptop:flex-row laptop:items-start laptop:gap-7'>
        {!loadError && (
          <div className='laptop:hidden'>
            <label htmlFor='devhub-mobile-category' className='mb-2 block text-[11px] uppercase tracking-[0.12em] text-subtle'>
              {t('categoriesLabel')}
            </label>
            <div className='relative'>
              <select
                id='devhub-mobile-category'
                value={activeCategory}
                onChange={event => {
                  setActiveCategory(event.target.value)
                  setVisibleCount(PAGE_SIZE)
                }}
                className='h-11 w-full appearance-none rounded-[8px] border border-border-strong bg-surface pl-3.5 pr-10 text-[13px] text-text outline-none focus:border-[var(--mint-edge)] focus:ring-4 focus:ring-[var(--mint-dim)]'
              >
                <option value='all'>{t('all')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {categoryLabels.get(category.id) ?? category.name}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden='true' className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted' />
            </div>
          </div>
        )}
        {!loadError && (
          <aside aria-label={t('categoriesLabel')} className='hidden w-[220px] shrink-0 flex-col gap-2.5 laptop:flex'>
            <h2 className='mb-1 pl-2.5 text-[11px] font-normal uppercase tracking-[0.14em] text-subtle'>
              {t('categoriesLabel')}
            </h2>
            <div className='flex flex-col gap-0.5'>
              <button
                type='button'
                aria-pressed={activeCategory === 'all'}
                onClick={() => { setActiveCategory('all'); setVisibleCount(PAGE_SIZE) }}
                className={'flex min-h-9 items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[12.5px] transition-colors ' +
                  (activeCategory === 'all'
                    ? 'bg-[var(--mint-dim)] text-accent'
                    : 'text-muted hover:bg-surface-hover hover:text-text')}
              >
                <span aria-hidden='true' className={'h-[5px] w-[5px] shrink-0 rounded-full ' + (activeCategory === 'all' ? 'bg-accent' : 'bg-border-strong')} />
                {t('all')}
              </button>
              {categories.map(category => {
                const active = activeCategory === category.id
                return (
                  <button
                    key={category.id}
                    type='button'
                    aria-pressed={active}
                    onClick={() => { setActiveCategory(category.id); setVisibleCount(PAGE_SIZE) }}
                    className={'flex min-h-9 items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[12.5px] transition-colors ' +
                      (active ? 'bg-[var(--mint-dim)] text-accent' : 'text-muted hover:bg-surface-hover hover:text-text')}
                  >
                    <span aria-hidden='true' className={'h-[5px] w-[5px] shrink-0 rounded-full ' + (active ? 'bg-accent' : 'bg-border-strong')} />
                    <span>{categoryLabels.get(category.id) ?? category.name}</span>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <div className='min-w-0 w-full flex-1'>
          {loadError ? emptyState(t('catalogErrorHeading'), t('catalogErrorDescription'), true) : (
            <>
              <div className='mb-[18px] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2'>
                <h2 className='font-sans text-[20px] font-semibold tracking-[-0.02em] text-text tablet:text-[22px]'>{heading}</h2>
                <span aria-live='polite' className='text-[12px] text-subtle'>{resultLabel}</span>
              </div>
              {visibleTools.length === 0
                ? emptyState(t('noResultsHeading'), t('noResultsDescription'))
                : (
                  <>
                    <div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3'>
                      {displayedTools.map(tool => (
                        <DirectoryToolCard
                          key={tool.id}
                          tool={tool}
                          categoryName={categoryLabels.get(tool.categoryId)}
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className='flex flex-col items-center gap-3 pt-7'>
                        <p aria-live='polite' className='text-[12px] text-subtle'>
                          {t('showing')} {displayedTools.length} {t('of')} {tools.length} {t('toolsCount')}
                        </p>
                        <button
                          type='button'
                          onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                          className='inline-flex h-11 items-center rounded-[6px] border border-border-strong bg-surface px-5 text-[13px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
                        >
                          {t('loadMore')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              {selectedCategory && (
                <Link
                  href={'/tools/' + encodeURIComponent(selectedCategory.name)}
                  className='mt-5 inline-flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-accent'
                >
                  {t('viewCategory')} {categoryLabels.get(selectedCategory.id)} <ArrowUpRight aria-hidden='true' className='h-3 w-3' />
                </Link>
              )}
            </>
          )}
        </div>
      </section>

      <section id='sugerir' className='pb-12'>
        <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[10px] border border-border-strong bg-surface px-5 py-4'>
          <p className='text-[13px] text-muted'>{t('contributePrompt')}</p>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={requestSuggestionModal}
              className='inline-flex h-[38px] items-center rounded-[6px] border border-border-strong px-3.5 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
            >
              {t('suggestTool')}
            </button>
            <Link
              href='https://github.com/mateusarcedev/devlist'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex h-[38px] items-center rounded-[6px] border border-border-strong px-3.5 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
