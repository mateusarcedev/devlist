'use client'

/* eslint-disable @next/next/no-img-element -- Github avatars are external verified account images. */

import type { GitHubCodeContributor } from '@/lib/github-code-contributors'
import { useI18n } from '@/contexts/i18n-context'
import { ArrowUpRight, GitCommitHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  data: GitHubCodeContributor[]
  loadError?: boolean
}

export default function GitHubContributorsSection({ data, loadError = false }: Props) {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <section aria-labelledby='code-contributors-title' className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2'>
        <div>
          <h2 id='code-contributors-title' className='font-sans text-[20px] font-semibold tracking-[-0.02em] text-text'>
            {t('contributorsCodeHeading')}
          </h2>
          <p className='mt-1 text-[12.5px] text-muted'>{t('contributorsCodeDescription')}</p>
        </div>
        {!loadError && <span className='text-[12px] text-subtle'>{data.length} {t('contributorsCodeCount')}</span>}
      </div>

      {loadError ? (
        <div role='alert' className='flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-border-strong p-5'>
          <p className='text-[12.5px] text-muted'>{t('contributorsCodeUnavailable')}</p>
          <div className='flex flex-wrap gap-3'>
            <button type='button' onClick={() => router.refresh()} className='text-[12px] text-accent hover:underline'>
              {t('retry')}
            </button>
            <a href='https://github.com/mateusarcedev/devlist/graphs/contributors'
              target='_blank' rel='noopener noreferrer' className='text-[12px] text-muted hover:text-accent'>
              {t('contributorsGithubGraph')} ↗
            </a>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className='flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-strong p-6 text-center'>
          <p className='text-[12.5px] text-muted'>{t('contributorsNoCode')}</p>
          <a href='https://github.com/mateusarcedev/devlist/graphs/contributors'
            target='_blank' rel='noopener noreferrer' className='text-[12px] text-accent hover:underline'>
            {t('contributorsGithubGraph')}
          </a>
        </div>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3'>
          {data.map(person => (
            <article key={person.login} className='flex min-w-0 flex-col justify-between gap-4 rounded-[10px] border border-border-strong bg-surface p-[18px] transition-colors hover:border-[var(--mint-edge)]'>
              <div className='flex min-w-0 items-center gap-3'>
                <span className='relative grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-full border border-border-strong bg-surface-hover font-sans text-sm font-semibold text-text'>
                  {person.login.charAt(0).toUpperCase()}
                  <img src={person.avatarUrl} alt='' loading='lazy' decoding='async'
                    className='absolute inset-0 h-full w-full object-cover'
                    onError={event => { event.currentTarget.style.display = 'none' }} />
                </span>
                <div className='min-w-0 flex-1'>
                  <h3 className='truncate font-sans text-[15px] font-semibold tracking-[-0.01em] text-text'>@{person.login}</h3>
                  <span className='text-[11px] text-subtle'>GitHub</span>
                </div>
                <div className='shrink-0 text-right'>
                  <span className='block font-mono text-[18px] font-semibold tabular-nums text-accent'>{person.commits}</span>
                  <span className='inline-flex items-center gap-1 text-[10.5px] text-subtle'>
                    <GitCommitHorizontal aria-hidden='true' className='h-3 w-3' /> {t('contributorsCommits')}
                  </span>
                </div>
              </div>
              <a href={person.profileUrl} target='_blank' rel='noopener noreferrer'
                aria-label={t('contributorsProfile') + ' @' + person.login}
                className='inline-flex w-fit items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-accent'>
                {t('contributorsProfile')}
                <ArrowUpRight aria-hidden='true' className='h-3 w-3' />
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
