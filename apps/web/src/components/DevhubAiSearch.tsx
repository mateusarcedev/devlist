'use client'

/* eslint-disable @next/next/no-img-element -- Favicon service is already used by catalog cards. */

import ToolAccessBadge from '@/components/ToolAccessBadge'
import { useI18n } from '@/contexts/i18n-context'
import type { AccessModel } from '@/lib/tool-access'
import { withReferral } from '@/lib/tool-url'
import { ArrowUpRight, LoaderCircle, MessageCircle, Plus, Send, Sparkles, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

interface AiTool {
  id: string
  name: string
  link: string
  description: string
  categoryName: string
  accessModel: Extract<AccessModel, 'OPEN_SOURCE' | 'FREE' | 'FREEMIUM'>
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  results?: AiTool[]
  visibleCount?: number
  isError?: boolean
}

const PAGE_SIZE = 8

const copy = {
  en: {
    title: 'DevHub AI',
    open: 'Open DevHub AI chat',
    close: 'Close DevHub AI chat',
    newChat: 'New chat',
    intro: 'Describe your development problem and I will find relevant tools in the DevHub catalog.',
    note: 'Searches the real catalog. Responses are recommendations, not generated claims about tools.',
    label: 'Ask DevHub AI',
    placeholder: 'What tools do you need?',
    example: 'Try an example',
    exampleQuery: 'I need to deploy Docker apps on my VPS without paying for a PaaS',
    submit: 'Send message',
    waiting: 'Searching the catalog…',
    found: 'Found {count} matching tools in the catalog.',
    empty: 'No clear matches found. Try another description.',
    error: 'Could not complete this search. Please try again.',
    more: 'Show more tools ({count} remaining)',
    visit: 'Visit tool',
    you: 'You',
    assistant: 'DevHub AI',
  },
  'pt-BR': {
    title: 'DevHub AI',
    open: 'Abrir chat do DevHub AI',
    close: 'Fechar chat do DevHub AI',
    newChat: 'Nova conversa',
    intro: 'Descreva seu problema de desenvolvimento e vou procurar ferramentas relacionadas no catálogo DevHub.',
    note: 'Pesquisa o catálogo real. As respostas são recomendações, não afirmações inventadas sobre ferramentas.',
    label: 'Pergunte ao DevHub AI',
    placeholder: 'De quais ferramentas você precisa?',
    example: 'Usar exemplo',
    exampleQuery: 'Preciso hospedar aplicações Docker na minha VPS sem pagar por um PaaS',
    submit: 'Enviar mensagem',
    waiting: 'Pesquisando no catálogo…',
    found: 'Encontrei {count} ferramentas relacionadas no catálogo.',
    empty: 'Não encontrei resultados claramente relacionados. Tente outra descrição.',
    error: 'Não foi possível concluir a busca. Tente novamente.',
    more: 'Ver mais ferramentas ({count} restantes)',
    visit: 'Visitar ferramenta',
    you: 'Você',
    assistant: 'DevHub AI',
  },
}

function getDomain(link: string): string {
  try { return new URL(link).hostname.replace(/^www\./, '') }
  catch { return link }
}

/** Short follow-ups reuse the most recent need without pretending this is a generative chat model. */
function searchWithContext(prompt: string, previous: string): string {
  const followUp = /^(e\s|mas\s|s[oó]\s|somente\s|apenas\s|sem\s|com\s|tamb[eé]m\s|only\s|without\s|with\s|also\s|and\s|but\s)/i.test(prompt)
  const combined = previous + '. ' + prompt
  return previous && followUp && combined.length <= 300 ? combined : prompt
}

export default function DevhubAiSearch() {
  const { locale } = useI18n()
  const pathname = usePathname()
  const t = copy[locale]
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const lastQuery = useRef('')
  const controller = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [open, messages, busy])

  useEffect(() => {
    if (!open) return
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        launcherRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [open])

  // The floating assistant is available across public pages, not on admin or login screens.
  if (pathname?.startsWith('/admin') || pathname === '/login') return null

  const close = () => {
    controller.current?.abort()
    setBusy(false)
    setOpen(false)
    launcherRef.current?.focus()
  }

  const newChat = () => {
    controller.current?.abort()
    setBusy(false)
    setMessages([])
    setInput('')
    lastQuery.current = ''
    inputRef.current?.focus()
  }

  const send = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const prompt = input.trim()
    if (busy || prompt.length < 8 || prompt.length > 300) return

    const query = searchWithContext(prompt, lastQuery.current)
    const request = new AbortController()
    controller.current?.abort()
    controller.current = request
    setInput('')
    setMessages(current => [...current, { id: nextId.current++, role: 'user', text: prompt }])
    setBusy(true)
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: request.signal,
      })
      const body: { results?: AiTool[]; message?: string } = await response.json()
      if (!response.ok) throw new Error(body.message || t.error)
      if (!Array.isArray(body.results)) throw new Error(t.error)
      if (!request.signal.aborted) {
        const count = body.results.length
        setMessages(current => [...current, {
          id: nextId.current++, role: 'assistant',
          text: count ? t.found.replace('{count}', String(count)) : t.empty,
          results: body.results,
          visibleCount: PAGE_SIZE,
        }])
        lastQuery.current = query
      }
    } catch (error) {
      if (!request.signal.aborted) setMessages(current => [...current, {
        id: nextId.current++, role: 'assistant',
        text: error instanceof Error ? error.message : t.error,
        isError: true,
      }])
    } finally {
      if (!request.signal.aborted) {
        setBusy(false)
        inputRef.current?.focus()
      }
    }
  }

  const revealMore = (id: number) => {
    setMessages(current => current.map(message => message.id === id
      ? { ...message, visibleCount: (message.visibleCount ?? PAGE_SIZE) + PAGE_SIZE }
      : message))
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <>
      {!open && (
        <button ref={launcherRef} type='button' onClick={() => setOpen(true)}
          aria-label={t.open} aria-expanded={false} aria-controls='devhub-ai-window'
          className='fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-4 z-[80] inline-flex min-h-12 items-center gap-2.5 rounded-full border border-[var(--mint-edge)] bg-surface px-4 py-3 font-sans text-[13px] font-semibold text-text shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent tablet:right-6'>
          <Sparkles aria-hidden='true' className='h-[18px] w-[18px] text-accent'/>
          {t.title}
          <MessageCircle aria-hidden='true' className='h-[16px] w-[16px] text-subtle'/>
        </button>
      )}
      {open && (
        <section id='devhub-ai-window' role='dialog' aria-label={t.title}
          className='fixed inset-0 z-[90] flex min-h-0 flex-col overflow-hidden border border-border-strong bg-surface shadow-[0_16px_64px_rgba(0,0,0,0.4)] tablet:inset-auto tablet:bottom-5 tablet:right-5 tablet:h-[min(680px,calc(100dvh-40px))] tablet:w-[min(440px,calc(100vw-40px))] tablet:rounded-[16px]'>
          <header className='flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] tablet:pt-4'>
            <div className='flex min-w-0 items-center gap-2.5'>
              <span className='grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--mint-dim)]'>
                <Sparkles aria-hidden='true' className='h-[18px] w-[18px] text-accent'/>
              </span>
              <div className='min-w-0'>
                <h2 className='font-sans text-[15px] font-semibold text-text'>{t.title}</h2>
                <p className='text-[11px] text-subtle'>{t.note}</p>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-1'>
              <button type='button' aria-label={t.newChat} title={t.newChat} onClick={newChat}
                className='grid h-9 w-9 place-items-center rounded-[7px] text-muted hover:bg-surface-hover hover:text-text'>
                <Plus aria-hidden='true' className='h-4 w-4'/>
              </button>
              <button type='button' aria-label={t.close} title={t.close} onClick={close}
                className='grid h-9 w-9 place-items-center rounded-[7px] text-muted hover:bg-surface-hover hover:text-text'>
                <X aria-hidden='true' className='h-4 w-4'/>
              </button>
            </div>
          </header>

          <div role='log' aria-label={t.title} aria-live='polite'
            className='min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5'>
            {messages.length === 0 && (
              <div className='flex flex-col items-start gap-3'>
                <span className='grid h-9 w-9 place-items-center rounded-full bg-[var(--mint-dim)]'>
                  <Sparkles aria-hidden='true' className='h-[17px] w-[17px] text-accent'/>
                </span>
                <p className='max-w-[95%] rounded-[12px] rounded-tl-[3px] bg-canvas px-4 py-3 text-[13px] leading-relaxed text-text'>{t.intro}</p>
                <button type='button' onClick={() => { setInput(t.exampleQuery); inputRef.current?.focus() }}
                  className='rounded-full border border-border-strong px-3 py-2 text-[12px] text-muted hover:border-[var(--mint-edge)] hover:text-accent'>
                  {t.example}
                </button>
              </div>
            )}
            {messages.map(message => (
              <div key={message.id} className={'flex flex-col gap-2 ' + (message.role === 'user' ? 'items-end' : 'items-start')}>
                <span className='px-1 text-[10.5px] font-medium text-subtle'>{message.role === 'user' ? t.you : t.assistant}</span>
                <div className={'max-w-[95%] whitespace-pre-wrap break-words rounded-[12px] px-3.5 py-2.5 text-[12.5px] leading-relaxed ' +
                  (message.role === 'user' ? 'rounded-tr-[3px] bg-[var(--mint-dim)] text-text' : 'rounded-tl-[3px] bg-canvas text-text') +
                  (message.isError ? ' border border-[var(--pink)] text-danger' : '')}>
                  {message.text}
                </div>
                {message.results && message.results.length > 0 && (
                  <div className='w-full space-y-2'>
                    {message.results.slice(0, message.visibleCount ?? PAGE_SIZE).map(tool => (
                      <article key={tool.id} className='rounded-[10px] border border-border-strong bg-canvas p-3'>
                        <div className='flex items-start gap-2.5'>
                          <span className='grid h-9 w-9 shrink-0 place-items-center rounded-[7px] border border-border-strong bg-surface'>
                            <img src={'https://www.google.com/s2/favicons?sz=128&domain=' + encodeURIComponent(getDomain(tool.link))}
                              alt='' loading='lazy' className='h-5 w-5 object-contain'
                              onError={event => { event.currentTarget.style.display = 'none' }}/>
                          </span>
                          <div className='min-w-0 flex-1'>
                            <h3 className='text-[13px] font-semibold text-text'>{tool.name}</h3>
                            <p className='truncate text-[10.5px] text-subtle'>{getDomain(tool.link)}</p>
                          </div>
                          <ToolAccessBadge model={tool.accessModel}/>
                        </div>
                        <p className='mt-2 whitespace-normal break-words text-[12px] leading-relaxed text-muted'>{tool.description}</p>
                        <div className='mt-2 flex items-center justify-between gap-2'>
                          <span className='min-w-0 truncate text-[10.5px] text-subtle'>{tool.categoryName}</span>
                          <a href={withReferral(tool.link)} target='_blank' rel='noopener noreferrer'
                            aria-label={t.visit + ': ' + tool.name}
                            className='inline-flex shrink-0 items-center gap-1 text-[11.5px] text-accent hover:underline'>
                            {t.visit}<ArrowUpRight aria-hidden='true' className='h-3.5 w-3.5'/>
                          </a>
                        </div>
                      </article>
                    ))}
                    {(message.visibleCount ?? PAGE_SIZE) < message.results.length && (
                      <button type='button' onClick={() => revealMore(message.id)}
                        className='w-full rounded-[8px] border border-[var(--mint-edge)] px-3 py-2.5 text-[12px] font-medium text-accent hover:bg-[var(--mint-dim)]'>
                        {t.more.replace('{count}', String(message.results.length - (message.visibleCount ?? PAGE_SIZE)))}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && <p role='status' className='flex items-center gap-2 text-[12px] text-muted'>
              <LoaderCircle aria-hidden='true' className='h-4 w-4 animate-spin'/>{t.waiting}
            </p>}
            <div ref={endRef}/>
          </div>

          <form onSubmit={event => void send(event)} className='shrink-0 border-t border-border bg-surface px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 tablet:px-4'>
            <div className='flex items-end gap-2 rounded-[10px] border border-border-strong bg-canvas p-2 focus-within:border-[var(--mint-edge)]'>
              <label htmlFor='devhub-ai-chat-input' className='sr-only'>{t.label}</label>
              <textarea ref={inputRef} id='devhub-ai-chat-input' value={input} rows={2} maxLength={300}
                onChange={event => setInput(event.target.value)} onKeyDown={onInputKeyDown}
                disabled={busy} placeholder={t.placeholder}
                className='max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] leading-relaxed text-text outline-none placeholder:text-subtle disabled:opacity-60'
              />
              <button type='submit' disabled={busy || input.trim().length < 8}
                aria-label={t.submit} title={t.submit}
                className='grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-accent text-[var(--on-mint)] disabled:cursor-not-allowed disabled:opacity-40'>
                {busy ? <LoaderCircle aria-hidden='true' className='h-4 w-4 animate-spin'/> :
                  <Send aria-hidden='true' className='h-4 w-4'/>}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
