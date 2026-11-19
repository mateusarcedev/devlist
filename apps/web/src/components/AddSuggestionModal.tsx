'use client'

import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/contexts/i18n-context'
import { useSubmitSuggestion } from '@/hooks/useSubmitSuggestion'
import { normalizeSuggestionUrl, SuggestionUrlError } from '@/lib/suggestion-url'
import { Check, LoaderCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const primary = 'inline-flex h-10 items-center justify-center rounded-[6px] bg-accent px-4 text-[12.5px] font-semibold text-[var(--on-mint)] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'
const outline = 'inline-flex h-10 items-center justify-center rounded-[6px] border border-border-strong px-3.5 text-[12.5px] text-text transition-colors hover:border-[var(--mint-edge)] hover:text-accent'

export default function AddSuggestionModal({ isOpen, onClose }: Props) {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const doneButtonRef = useRef<HTMLButtonElement>(null)
  const pendingRef = useRef(false)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [submittedHost, setSubmittedHost] = useState('')

  const mutation = useSubmitSuggestion({
    onSuccess: result => {
      setSubmittedHost(result.host)
      setError('')
      setStep('done')
    },
    onError: cause => {
      setError(cause instanceof Error
        ? cause.message
        : t('suggestErrorGeneric'))
    },
  })

  pendingRef.current = mutation.isPending

  const closeModal = () => {
    if (mutation.isPending) return
    setLink('')
    setError('')
    setStep('form')
    setSubmittedHost('')
    mutation.reset()
    onClose()
  }

  const startAnother = () => {
    mutation.reset()
    setLink('')
    setError('')
    setSubmittedHost('')
    setStep('form')
  }

  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!pendingRef.current) {
          event.preventDefault()
          // A click on the close button uses the same teardown as the keyboard.
          dialogRef.current?.querySelector<HTMLButtonElement>('[data-close-dialog]')?.click()
        }
        return
      }
      if (event.key !== 'Tab') return
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ) ?? [])
      if (!elements.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (step === 'done') doneButtonRef.current?.focus()
    else inputRef.current?.focus()
  }, [isOpen, step])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mutation.isPending || !user || loading) return
    try {
      const normalized = normalizeSuggestionUrl(link)
      setError('')
      mutation.mutate({ url: normalized.url })
    } catch (cause) {
      setError(cause instanceof SuggestionUrlError
        ? cause.message
        : t('suggestInvalidUrl'))
    }
  }

  if (!isOpen) return null

  const account = user?.githubLogin ? '@' + user.githubLogin : user?.name ?? ''
  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-5'
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeModal()
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='suggest-dialog-title'
        aria-describedby={step === 'form' ? 'suggest-dialog-description' : 'suggest-dialog-success-description'}
        className='dl-enter max-h-[calc(100vh-40px)] w-full max-w-[460px] overflow-y-auto rounded-[14px] border border-border-strong bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]'
      >
        {step === 'done' ? (
          <div role='status' className='flex flex-col items-center gap-2.5 px-6 pb-[22px] pt-7 text-center'>
            <span aria-hidden='true' className='grid h-11 w-11 place-items-center rounded-full border border-[var(--mint-edge)] bg-[var(--mint-dim)] text-accent'>
              <Check className='h-5 w-5' strokeWidth={2} />
            </span>
            <h2 id='suggest-dialog-title' className='font-sans text-[18px] font-semibold tracking-[-0.015em] text-text'>
              {t('suggestSentTitle')}
            </h2>
            <p id='suggest-dialog-success-description' className='max-w-[360px] text-[12.5px] leading-[1.6] text-muted'>
              <span className='text-text'>{submittedHost}</span> {t('suggestSentDescription')}
            </p>
            <div className='mt-2 flex flex-wrap items-center justify-center gap-2'>
              <button type='button' onClick={startAnother} className={outline}>{t('suggestAnother')}</button>
              <button ref={doneButtonRef} data-close-dialog type='button' onClick={closeModal} className={primary}>{t('close')}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className='flex flex-col gap-4 px-6 pb-5 pt-[22px]'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex flex-col gap-1'>
                <h2 id='suggest-dialog-title' className='font-sans text-[18px] font-semibold tracking-[-0.015em] text-text'>
                  {t('suggestTool')}
                </h2>
                <p id='suggest-dialog-description' className='text-[12.5px] leading-[1.6] text-muted'>
                  {t('suggestUrlDescription')}
                </p>
              </div>
              <button
                type='button'
                data-close-dialog
                onClick={closeModal}
                disabled={mutation.isPending}
                aria-label={t('close')}
                className='-mr-2 -mt-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-[6px] text-muted transition-colors hover:bg-[var(--mint-dim)] hover:text-accent disabled:opacity-40'
              >
                <X aria-hidden='true' className='h-4 w-4' strokeWidth={1.8} />
              </button>
            </div>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='suggest-url' className='text-[12px] text-muted'>{t('suggestLinkLabel')}</label>
              <input
                ref={inputRef}
                id='suggest-url'
                type='text'
                inputMode='url'
                autoComplete='url'
                value={link}
                disabled={mutation.isPending}
                onChange={event => {
                  setLink(event.target.value)
                  if (error) setError('')
                }}
                placeholder='https://exemplo.com'
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'suggest-url-error' : undefined}
                className={'h-[46px] w-full rounded-[8px] border bg-canvas px-3.5 text-[13.5px] text-text outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-[var(--mint-edge)] focus:shadow-[0_0_0_4px_var(--mint-dim)] ' +
                  (error ? 'border-[var(--pink)]' : 'border-border-strong')}
              />
              {error && (
                <span id='suggest-url-error' role='alert' className='text-[12px] text-[var(--pink)]'>{error}</span>
              )}
            </div>
            <div className='flex flex-wrap items-center justify-between gap-3 pt-1'>
              <div className='text-[11.5px] text-subtle'>
                {!loading && user ? (
                  <span className='inline-flex items-center gap-2'>
                    <span aria-hidden='true' className='grid h-5 w-5 place-items-center rounded-full bg-surface-hover text-[10px] font-semibold text-text'>
                      {(user.name || '?').charAt(0).toUpperCase()}
                    </span>
                    {t('suggestSubmittingAs')} {account}
                  </span>
                ) : (
                  <button type='button' onClick={() => { closeModal(); router.push('/login') }}
                    className='text-accent underline-offset-2 hover:underline'>{t('suggestSignInGithub')}</button>
                )}
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <button type='button' onClick={closeModal} disabled={mutation.isPending} className={outline}>{t('cancel')}</button>
                {user && (
                  <button type='submit' disabled={mutation.isPending || loading} className={primary}>
                    {mutation.isPending && <LoaderCircle aria-hidden='true' className='mr-1.5 h-3.5 w-3.5 animate-spin' />}
                    {mutation.isPending ? t('suggestSending') : t('suggestSubmit')}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
