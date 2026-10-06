'use client'

import { useAuth } from '@/hooks/useAuth'
import { useSubmitSuggestion } from '@/hooks/useSubmitSuggestion'
import { getApiErrorMessage } from '@/lib/http-error'
import type { Category, Suggestion } from '@/types'
import { AxiosConfig } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SubmitResult {
  status: 'success' | 'error'
  data?: Suggestion
  message?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (result: SubmitResult) => void
}

async function fetchCategories(): Promise<Category[]> {
  const { data } = await AxiosConfig.get<Category[]>('/categories')
  return data
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

export default function AddSuggestionModal({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [submitError, setSubmitError] = useState('')

  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isOpen && Boolean(user),
  })

  const mutation = useSubmitSuggestion({
    onSuccess: data => {
      setName('')
      setLink('')
      setDescription('')
      setCategoryId('')
      setSubmitError('')
      onClose()
      onSubmit?.({ status: 'success', data })
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        'Error sending suggestion. Please try again.',
      )
      setSubmitError(message)
      onSubmit?.({ status: 'error', message })
    },
  })

  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !mutation.isPending) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, mutation.isPending, onClose])

  if (!isOpen) return null

  const remainingChars = 230 - description.length
  const submitDisabled =
    mutation.isPending ||
    isLoading ||
    isError ||
    !name.trim() ||
    !link.trim() ||
    !description.trim() ||
    !categoryId ||
    remainingChars < 0

  const closeModal = () => {
    if (!mutation.isPending) {
      setSubmitError('')
      onClose()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || submitDisabled) return

    setSubmitError('')
    mutation.mutate({ name, link, description, categoryId })
  }

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4'
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeModal()
      }}
    >
      {!user ? (
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='suggest-auth-title'
          className='dl-enter w-full max-w-[360px] rounded-[12px] border border-border-strong bg-surface p-7 text-center shadow-[0_20px_60px_rgba(0,0,0,.55)]'
        >
          <h2
            id='suggest-auth-title'
            className='text-[17px] font-semibold text-white'
          >
            Sign in required
          </h2>
          <p className='mb-5 mt-2 text-[13px] leading-5 text-muted'>
            You need to be signed in to suggest a tool.
          </p>
          <div className='flex justify-center gap-2'>
            <button
              type='button'
              onClick={closeModal}
              className='rounded-[6px] border border-border-strong px-3.5 py-2 text-[13px] font-medium text-text transition-colors hover:bg-surface-hover'
            >
              Close
            </button>
            <button
              type='button'
              onClick={() => {
                closeModal()
                router.push('/login')
              }}
              className='rounded-[6px] bg-white px-3.5 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
            >
              Sign in
            </button>
          </div>
        </div>
      ) : (
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='suggest-title'
          className='dl-enter max-h-[88vh] w-full max-w-[440px] overflow-y-auto rounded-[12px] border border-border-strong bg-surface shadow-[0_20px_60px_rgba(0,0,0,.55)]'
        >
          <div className='sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-5'>
            <h2
              id='suggest-title'
              className='text-base font-semibold text-white'
            >
              Suggest a tool
            </h2>
            <button
              type='button'
              onClick={closeModal}
              disabled={mutation.isPending}
              aria-label='Close'
              className='rounded-[5px] p-1 text-subtle transition-colors hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-50'
            >
              <X className='h-[18px] w-[18px]' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-6'>
            <div className='flex items-center gap-2.5 rounded-[8px] bg-surface-hover px-3 py-2.5'>
              <div className='flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border-strong bg-border font-mono text-[11px] font-semibold text-text'>
                {initials(user.name)}
              </div>
              <span className='text-[13px] text-text'>{user.name}</span>
            </div>

            {submitError && (
              <div
                role='alert'
                className='flex items-start gap-2 rounded-[6px] border border-[#3a1414] bg-[#1a0a0a] px-3 py-2.5 text-[13px] text-danger'
              >
                <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor='suggest-name'
                className='mb-1.5 block text-[13px] text-muted'
              >
                Tool name
              </label>
              <input
                id='suggest-name'
                type='text'
                value={name}
                onChange={event => setName(event.target.value)}
                disabled={mutation.isPending}
                className='dl-control h-10 w-full px-3 text-sm outline-none focus:border-zinc-600'
                required
              />
            </div>

            <div>
              <label
                htmlFor='suggest-link'
                className='mb-1.5 block text-[13px] text-muted'
              >
                Link
              </label>
              <input
                id='suggest-link'
                type='url'
                value={link}
                onChange={event => setLink(event.target.value)}
                disabled={mutation.isPending}
                placeholder='https://...'
                className='dl-control h-10 w-full px-3 text-sm outline-none focus:border-zinc-600'
                required
              />
            </div>

            <div>
              <div className='mb-1.5 flex items-center justify-between gap-4'>
                <label
                  htmlFor='suggest-description'
                  className='text-[13px] text-muted'
                >
                  Description
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    remainingChars < 0 ? 'text-danger' : 'text-subtle'
                  }`}
                >
                  {remainingChars} / 230
                </span>
              </div>
              <textarea
                id='suggest-description'
                value={description}
                onChange={event => setDescription(event.target.value)}
                disabled={mutation.isPending}
                rows={4}
                maxLength={230}
                className='dl-control min-h-28 w-full resize-y px-3 py-2.5 text-sm outline-none focus:border-zinc-600'
                required
              />
            </div>

            <div>
              <label
                htmlFor='suggest-category'
                className='mb-1.5 block text-[13px] text-muted'
              >
                Category
              </label>

              {isError ? (
                <div className='rounded-[6px] border border-[#3a1414] bg-[#1a0a0a] px-3 py-2.5 text-[13px] text-muted'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span>Couldn&apos;t load categories.</span>
                    <button
                      type='button'
                      onClick={() => void refetch()}
                      className='font-medium text-text underline-offset-4 hover:underline'
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  id='suggest-category'
                  value={categoryId}
                  onChange={event => setCategoryId(event.target.value)}
                  disabled={isLoading || mutation.isPending}
                  className='dl-control h-10 w-full px-3 text-sm outline-none [color-scheme:dark] focus:border-zinc-600'
                  required
                >
                  <option value=''>
                    {isLoading ? 'Loading categories...' : 'Select a category'}
                  </option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type='submit'
              disabled={submitDisabled}
              className='mt-1 flex h-10 w-full items-center justify-center rounded-[6px] bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-border disabled:text-subtle'
            >
              {mutation.isPending ? 'Sending...' : 'Submit suggestion'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
