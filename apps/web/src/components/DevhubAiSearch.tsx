'use client'

/* eslint-disable @next/next/no-img-element -- Favicon service is used by the existing tool cards. */

import { useI18n } from '@/contexts/i18n-context'
import ToolAccessBadge from '@/components/ToolAccessBadge'
import { withReferral } from '@/lib/tool-url'
import type { AccessModel } from '@/lib/tool-access'
import { ArrowUpRight, LoaderCircle, Search, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

interface AiTool {
  id: string
  name: string
  link: string
  description: string
  categoryName: string
  accessModel: Extract<AccessModel,'OPEN_SOURCE'|'FREE'|'FREEMIUM'>
}

const copy = {
  en: {
    title: 'DevHub AI — Find the right tool',
    description: 'Describe what you want to build or solve. Get recommendations from the DevHub catalog, not made-up tools.',
    label: 'What do you need?',
    placeholder: 'I need to deploy Docker applications on my VPS without paying for a PaaS',
    example: 'Try an example',
    exampleQuery: 'I need to deploy Docker applications on my VPS without paying for a PaaS',
    submit: 'Find tools',
    waiting: 'Finding matches…',
    results: 'Tools matching your needs',
    why: 'What it does',
    empty: 'No convincing matches were found in the current catalog. Try a more specific description.',
    error: 'Could not complete this search. Please try again.',
    note: 'AI semantic matching; descriptions and links come directly from the DevHub catalog.',
    visit: 'Visit',
  },
  'pt-BR': {
    title: 'DevHub AI — Encontre a ferramenta certa',
    description: 'Descreva o que você precisa desenvolver ou resolver. Receba sugestões reais do catálogo, sem ferramentas inventadas.',
    label: 'O que você precisa?',
    placeholder: 'Preciso hospedar aplicações Docker na minha VPS sem pagar por um PaaS',
    example: 'Usar exemplo',
    exampleQuery: 'Preciso hospedar aplicações Docker na minha VPS sem pagar por um PaaS',
    submit: 'Encontrar ferramentas',
    waiting: 'Buscando ferramentas…',
    results: 'Ferramentas recomendadas para sua necessidade',
    why: 'Para que serve',
    empty: 'Nenhuma ferramenta claramente relacionada foi encontrada. Tente descrever a necessidade de outra forma.',
    error: 'Não foi possível concluir a busca. Tente novamente.',
    note: 'Correspondência semântica por IA; descrições e links vêm diretamente do catálogo DevHub.',
    visit: 'Visitar',
  },
}

function getDomain(link: string) {
  try { return new URL(link).hostname.replace(/^www\./,'') }
  catch { return link }
}

export default function DevhubAiSearch() {
  const { locale } = useI18n()
  const t = copy[locale]
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AiTool[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || query.trim().length < 8) return
    controller.current?.abort()
    const active = new AbortController()
    controller.current = active
    setResults(null)
    setError('')
    setBusy(true)
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
        signal: active.signal,
      })
      const body: { results?: AiTool[], message?: string } = await response.json()
      if (!response.ok) throw new Error(body.message || t.error)
      if (!Array.isArray(body.results)) throw new Error(t.error)
      if (!active.signal.aborted) setResults(body.results)
    } catch (e) {
      if (!active.signal.aborted) setError(e instanceof Error ? e.message : t.error)
    } finally {
      if (!active.signal.aborted) setBusy(false)
    }
  }

  return (
    <section aria-labelledby='devhub-ai-heading' className='rounded-[12px] border border-[var(--mint-edge)] bg-surface p-4 tablet:p-5'>
      <div className='flex items-center gap-2'>
        <Sparkles aria-hidden='true' className='h-[18px] w-[18px] text-accent'/>
        <h2 id='devhub-ai-heading' className='font-sans text-[17px] font-semibold text-text tablet:text-[19px]'>
          {t.title}
        </h2>
      </div>
      <p className='mt-2 text-[12.5px] leading-relaxed text-muted'>{t.description}</p>

      <form onSubmit={event => void search(event)} className='mt-4'>
        <label htmlFor='devhub-ai-query' className='sr-only'>{t.label}</label>
        <textarea id='devhub-ai-query' rows={2} value={query} maxLength={300} disabled={busy}
          onChange={event => {setQuery(event.target.value);setResults(null);setError('')}}
          placeholder={t.placeholder}
          className='min-h-[88px] w-full resize-y rounded-[8px] border border-border-strong bg-canvas p-3 text-[13.5px] leading-relaxed text-text outline-none placeholder:text-subtle focus:border-[var(--mint-edge)] focus:ring-4 focus:ring-[var(--mint-dim)] disabled:opacity-60'
        />
        <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
          <button type='button' onClick={() => {setQuery(t.exampleQuery);setResults(null);setError('')}} disabled={busy}
            className='text-[12px] text-muted underline-offset-4 hover:text-accent hover:underline disabled:opacity-50'>
            {t.example}
          </button>
          <button type='submit' disabled={busy || query.trim().length < 8}
            className='inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] bg-accent px-4 text-[12.5px] font-semibold text-[var(--on-mint)] disabled:cursor-not-allowed disabled:opacity-45'>
            {busy ? <LoaderCircle aria-hidden='true' className='h-4 w-4 animate-spin'/> :
              <Search aria-hidden='true' className='h-4 w-4'/>}
            {busy ? t.waiting : t.submit}
          </button>
        </div>
      </form>
      {error && <p role='alert' className='mt-4 text-[12.5px] text-danger'>{error}</p>}
      {results !== null && (
        <div aria-live='polite' className='mt-6 border-t border-border pt-5'>
          <h3 className='mb-3 font-sans text-[15px] font-semibold text-text'>{t.results}</h3>
          {results.length === 0 ? <p className='text-[13px] text-muted'>{t.empty}</p> : (
            <div className='grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3'>
              {results.map(tool => (
                <article key={tool.id} className='flex min-w-0 flex-col gap-3 rounded-[10px] border border-border-strong bg-canvas p-4'>
                  <div className='flex min-w-0 items-center gap-3'>
                    <span className='grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-border-strong bg-surface-hover text-[15px] font-semibold text-text'>
                      <img src={'https://www.google.com/s2/favicons?sz=128&domain='+encodeURIComponent(getDomain(tool.link))}
                        alt='' loading='lazy' className='h-6 w-6 object-contain'
                        onError={event => {event.currentTarget.style.display='none'}}/>
                    </span>
                    <div className='min-w-0'>
                      <h4 className='truncate text-[14px] font-semibold text-text'>{tool.name}</h4>
                      <p className='truncate text-[11px] text-subtle'>{getDomain(tool.link)}</p>
                    </div>
                  </div>
                  <ToolAccessBadge model={tool.accessModel}/>
                  <div className='flex-1'>
                    <p className='mb-1 text-[11px] font-medium text-subtle'>{t.why}</p>
                    <p className='whitespace-normal break-words text-[12.5px] leading-relaxed text-muted'>{tool.description}</p>
                  </div>
                  <div className='flex items-center justify-between gap-2 border-t border-border pt-3'>
                    <span className='min-w-0 truncate text-[11px] text-subtle' title={tool.categoryName}>{tool.categoryName}</span>
                    <a href={withReferral(tool.link)} target='_blank' rel='noopener noreferrer'
                      className='inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-accent'>
                      {t.visit}<ArrowUpRight aria-hidden='true' className='h-3.5 w-3.5'/>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className='mt-3 text-[11px] text-subtle'>{t.note}</p>
        </div>
      )}
    </section>
  )
}
