'use client'

/* eslint-disable @next/next/no-img-element -- Verified GitHub OAuth avatar URLs are external user images. */

import { useI18n } from '@/contexts/i18n-context'
import GitHubContributorsSection from '@/components/GitHubContributorsSection'
import type { GitHubCodeContributor } from '@/lib/github-code-contributors'
import { sortContributors } from '@/lib/contributors'
import { requestSuggestionModal } from '@/lib/suggestion-trigger'
import type { ContributorSort, PublicContributor } from '@/lib/public-contributors'
import { ArrowUpRight, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  data: PublicContributor[]
  loadError?: boolean
  catalogPending?: boolean
  codeContributors?: GitHubCodeContributor[]
  codeLoadError?: boolean
}

function Avatar({ contributor }: { contributor: PublicContributor }) {
  return (
    <span className='relative grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-full border border-border-strong bg-surface-hover font-sans text-sm font-semibold text-text'>
      {contributor.login.charAt(0).toUpperCase()}
      <img
        src={contributor.avatarUrl}
        alt=''
        loading='lazy'
        decoding='async'
        className='absolute inset-0 h-full w-full object-cover'
        onError={event => { event.currentTarget.style.display = 'none' }}
      />
    </span>
  )
}

export default function CardsContributors({ data, loadError = false, catalogPending = false, codeContributors = [], codeLoadError = false }: Props) {
  const { t } = useI18n()
  const router = useRouter()
  const [sortBy, setSortBy] = useState<ContributorSort>('approved')
  const people = useMemo(() => sortContributors(data, sortBy), [data, sortBy])

  return (
    <main className='mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-[clamp(16px,2.3vw,28px)] pb-14 pt-9'>
      <header>
        <h1 className='font-sans text-[28px] font-semibold leading-[1.2] tracking-[-0.025em] text-text'>
          {t('contributorsHeading')}
        </h1>
        <p className='mt-1 text-[13px] leading-[1.6] text-muted'>{t('contributorsDescription')}</p>
      </header>

      <GitHubContributorsSection data={codeContributors} loadError={codeLoadError} />

      <section aria-labelledby='catalog-contributors-title' className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
          <div>
            <h2 id='catalog-contributors-title' className='font-sans text-[20px] font-semibold tracking-[-0.02em] text-text'>
              {t('contributorsCatalogHeading')}
            </h2>
            <p className='mt-1 text-[12.5px] text-muted'>{t('contributorsCatalogDescription')}</p>
          </div>
          {!loadError && people.length > 0 && (
            <div role='group' aria-label={t('contributorsSortLabel')} className='flex flex-wrap gap-1 rounded-[8px] border border-border-strong bg-surface p-[3px]'>
              {(['approved', 'recent'] as const).map(option => (
                <button
                  key={option}
                  type='button'
                  aria-pressed={sortBy === option}
                  onClick={() => setSortBy(option)}
                  className={'h-8 rounded-[6px] px-3 text-[12px] transition-colors ' +
                    (sortBy === option ? 'bg-surface-hover text-text' : 'text-muted hover:bg-surface-hover hover:text-text')}
                >
                  {option === 'approved' ? t('contributorsMostApproved') : t('contributorsMostRecent')}
                </button>
              ))}
            </div>
          )}
        </div>

      {loadError ? (
        <div role={catalogPending ? 'status' : 'alert'} className='flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-border-strong px-6 py-12 text-center'>
          <h2 className='font-sans text-[16px] font-semibold text-text'>{catalogPending ? t('contributorsSetupTitle') : t('contributorsErrorTitle')}</h2>
          <p className='max-w-[420px] text-[12.5px] text-muted'>{catalogPending ? t('contributorsSetupDescription') : t('contributorsErrorDescription')}</p>
          {!catalogPending && <button
            type='button'
            onClick={() => router.refresh()}
            className='inline-flex h-10 items-center rounded-[6px] border border-border-strong px-4 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
          >
            {t('retry')}
          </button>}
        </div>
      ) : people.length === 0 ? (
        <div className='flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-border-strong px-6 py-12 text-center'>
          <span aria-hidden='true' className='grid h-11 w-11 place-items-center rounded-full bg-[var(--mint-dim)] text-accent'>
            <UsersRound className='h-5 w-5' strokeWidth={1.7} />
          </span>
          <h2 className='font-sans text-[16px] font-semibold text-text'>{t('contributorsEmptyTitle')}</h2>
          <p className='max-w-[460px] text-[12.5px] leading-[1.6] text-muted'>{t('contributorsEmptyDescription')}</p>
          <button
            type='button'
            onClick={requestSuggestionModal}
            className='mt-1 inline-flex h-10 items-center rounded-[6px] border border-border-strong px-4 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
          >
            {t('suggestTool')}
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3'>
          {people.map(person => (
            <article
              key={person.login}
              className='flex min-w-0 flex-col gap-3.5 rounded-[10px] border border-border-strong bg-surface p-[18px] transition-colors hover:border-[var(--mint-edge)]'
            >
              <div className='flex items-center gap-3'>
                <Avatar contributor={person} />
                <div className='flex min-w-0 flex-1 flex-col'>
                  <div className='flex min-w-0 flex-wrap items-center gap-2'>
                    <h2 className='max-w-full truncate font-sans text-[15px] font-semibold tracking-[-0.01em] text-text'>
                      @{person.login}
                    </h2>
                    {person.isMaintainer && (
                      <span className='shrink-0 rounded-full border border-[var(--mint-edge)] px-[7px] py-[1px] text-[10px] text-accent'>
                        {t('contributorsMaintainer')}
                      </span>
                    )}
                  </div>
                  <span className='text-[11.5px] text-subtle'>{t('contributorsSince')} {person.sinceYear}</span>
                </div>
                <div className='shrink-0 text-right leading-[1.2]'>
                  <span className='block font-mono text-[18px] font-semibold tabular-nums text-accent'>{person.approvedCount}</span>
                  <span className='text-[10.5px] text-subtle'>{t('contributorsApprovedLabel')}</span>
                </div>
              </div>
              <div className='flex min-h-[50px] flex-col gap-1.5'>
                <span className='text-[10.5px] uppercase tracking-[0.12em] text-subtle'>{t('contributorsLatest')}</span>
                <div className='flex flex-wrap gap-1.5'>
                  {person.recentTools.map(tool => (
                    <span key={tool} title={tool} className='max-w-full truncate rounded-[6px] border border-border-strong px-2 py-[3px] text-[11.5px] text-muted'>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={'https://github.com/' + encodeURIComponent(person.login)}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('contributorsProfile') + ' @' + person.login}
                className='inline-flex w-fit items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-accent'
              >
                {t('contributorsProfile')}
                <ArrowUpRight aria-hidden='true' className='h-3 w-3' strokeWidth={2} />
              </a>
            </article>
          ))}
        </div>
      )}

      </section>

      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[10px] border border-border-strong bg-surface px-5 py-4'>
        <p className='text-[13px] text-muted'>{t('contributorsCTA')}</p>
        <button
          type='button'
          onClick={requestSuggestionModal}
          className='inline-flex h-[38px] items-center rounded-[6px] border border-border-strong px-3.5 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'
        >
          {t('suggestTool')}
        </button>
      </div>
    </main>
  )
}
