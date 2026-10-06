'use client'

import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/http-error'
import type { Category } from '@/types'
import { AxiosConfig } from '@/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

interface ToolFormData {
  name: string
  link: string
  description: string
  categoryId: string
}

export default function CreateToolPage() {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ToolFormData>({
    defaultValues: {
      name: '',
      link: '',
      description: '',
      categoryId: '',
    },
  })

  const descriptionValue = useWatch({
    control,
    name: 'description',
    defaultValue: '',
  })
  const remainingChars = 230 - descriptionValue.length

  const {
    data: categories,
    isLoading: loadingCategories,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await AxiosConfig.get<Category[]>('/categories')
      return response.data
    },
  })

  const createTool = useMutation({
    mutationFn: async (data: ToolFormData) => {
      const response = await AxiosConfig.post('/tools', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      reset()
      setSuccessMessage('Tool created successfully.')
      setErrorMessage('')
    },
    onError: (error: unknown) => {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'Failed to create tool. Please try again.',
        ),
      )
      setSuccessMessage('')
    },
  })

  const onSubmit = (data: ToolFormData) => {
    setSuccessMessage('')
    setErrorMessage('')
    createTool.mutate(data)
  }

  if (authLoading) {
    return (
      <main className='mx-auto w-full max-w-[520px] px-[clamp(16px,4vw,24px)] pb-24 pt-[clamp(32px,6vw,56px)]'>
        <div className='mb-4 h-6 w-16 animate-pulse rounded bg-surface-hover' />
        <div className='mb-8 h-9 w-56 animate-pulse rounded bg-surface-hover' />
        <div className='space-y-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className='mb-2 h-4 w-24 animate-pulse rounded bg-surface-hover' />
              <div className='h-10 w-full animate-pulse rounded-[6px] border border-border bg-surface' />
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <main className='mx-auto w-full max-w-[520px] px-[clamp(16px,4vw,24px)] pb-24 pt-[clamp(32px,6vw,56px)]'>
        <div className='px-4 py-24 text-center'>
          <h1 className='text-xl font-semibold text-white'>Admins only</h1>
          <p className='mx-auto mb-6 mt-2 max-w-[320px] text-sm leading-6 text-subtle'>
            This area is restricted to administrators.
          </p>
          <Link
            href='/'
            className='inline-flex rounded-[6px] bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
          >
            Back to Tools4.tech
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className='mx-auto w-full max-w-[520px] px-[clamp(16px,4vw,24px)] pb-24 pt-[clamp(32px,6vw,56px)]'>
      <div className='mb-4 inline-flex items-center gap-1.5 rounded-[4px] border border-[#0d3a26] bg-[#061a12] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.05em] text-accent'>
        Admin
      </div>
      <h1 className='mb-8 text-[26px] font-semibold tracking-[-0.02em] text-white'>
        Add a new tool
      </h1>

      {successMessage && (
        <div
          role='status'
          className='mb-6 flex items-center gap-2.5 rounded-[6px] border border-[#0d3a26] bg-[#061a12] px-3.5 py-3 text-[13px] text-text'
        >
          <CheckCircle2 className='h-4 w-4 shrink-0 text-accent' />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role='alert'
          className='mb-6 flex items-center gap-2.5 rounded-[6px] border border-[#3a1414] bg-[#1a0a0a] px-3.5 py-3 text-[13px] text-text'
        >
          <AlertCircle className='h-4 w-4 shrink-0 text-danger' />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div>
          <label
            htmlFor='admin-name'
            className='mb-1.5 block text-[13px] text-muted'
          >
            Name
          </label>
          <input
            id='admin-name'
            type='text'
            placeholder='Tool name'
            disabled={createTool.isPending}
            {...register('name', { required: 'Name is required' })}
            className={`dl-control h-10 w-full px-3 text-sm outline-none focus:border-zinc-600 ${
              errors.name ? 'border-danger' : ''
            }`}
          />
          {errors.name && (
            <p className='mt-1.5 text-xs text-danger'>{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='admin-link'
            className='mb-1.5 block text-[13px] text-muted'
          >
            Link
          </label>
          <input
            id='admin-link'
            type='url'
            placeholder='https://...'
            disabled={createTool.isPending}
            {...register('link', {
              required: 'URL is required',
              validate: value => {
                try {
                  new URL(value)
                  return true
                } catch {
                  return 'Enter a valid URL'
                }
              },
            })}
            className={`dl-control h-10 w-full px-3 text-sm outline-none focus:border-zinc-600 ${
              errors.link ? 'border-danger' : ''
            }`}
          />
          {errors.link && (
            <p className='mt-1.5 text-xs text-danger'>{errors.link.message}</p>
          )}
        </div>

        <div>
          <div className='mb-1.5 flex items-center justify-between gap-4'>
            <label
              htmlFor='admin-description'
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
            id='admin-description'
            rows={4}
            placeholder='What does this tool help developers do?'
            disabled={createTool.isPending}
            {...register('description', {
              required: 'Description is required',
              maxLength: {
                value: 230,
                message: 'Description cannot exceed 230 characters',
              },
            })}
            className={`dl-control min-h-28 w-full resize-y px-3 py-2.5 text-sm outline-none focus:border-zinc-600 ${
              errors.description || remainingChars < 0 ? 'border-danger' : ''
            }`}
          />
          {errors.description && (
            <p className='mt-1.5 text-xs text-danger'>
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='admin-category'
            className='mb-1.5 block text-[13px] text-muted'
          >
            Category
          </label>

          {categoriesError ? (
            <div className='rounded-[6px] border border-[#3a1414] bg-[#1a0a0a] px-3 py-2.5 text-[13px] text-muted'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span>Couldn&apos;t load categories.</span>
                <button
                  type='button'
                  onClick={() => void refetchCategories()}
                  className='font-medium text-text underline-offset-4 hover:underline'
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <select
              id='admin-category'
              disabled={loadingCategories || createTool.isPending}
              {...register('categoryId', { required: 'Category is required' })}
              className={`dl-control h-10 w-full px-3 text-sm outline-none [color-scheme:dark] focus:border-zinc-600 ${
                errors.categoryId ? 'border-danger' : ''
              }`}
            >
              <option value=''>
                {loadingCategories ? 'Loading categories...' : 'Select a category'}
              </option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}

          {errors.categoryId && !categoriesError && (
            <p className='mt-1.5 text-xs text-danger'>
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={
            createTool.isPending ||
            remainingChars < 0 ||
            loadingCategories ||
            categoriesError
          }
          className='flex h-10 w-full items-center justify-center rounded-[6px] bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-border disabled:text-subtle'
        >
          {createTool.isPending ? 'Creating...' : 'Create tool'}
        </button>
      </form>
    </main>
  )
}
