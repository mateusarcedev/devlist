'use client'

import { AxiosConfig } from '@/utils'
import type { Category } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface ToolFormData {
  name: string
  link: string
  description: string
  categoryID: string
}

const CreateToolPage = () => {
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ToolFormData>({
    defaultValues: {
      name: '',
      link: '',
      description: '',
      categoryID: '',
    },
  })

  const descriptionValue = watch('description') ?? ''
  const remainingChars = 230 - descriptionValue.length

  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
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
      setSuccessMessage('Tool created successfully!')
      setErrorMessage('')
    },
    onError: () => {
      setErrorMessage('Failed to create tool. Please try again.')
      setSuccessMessage('')
    },
  })

  const onSubmit = (data: ToolFormData) => {
    createTool.mutate(data)
  }

  if (loadingCategories) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <svg
          className='animate-spin h-8 w-8 text-blue-500'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <div>
        <div className='p-6'>
          <h2 className='text-2xl font-bold mb-6'>Add New Tool</h2>

          {successMessage && (
            <div className='mb-4 p-3 bg-green-100 text-green-700 rounded-md'>
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-400 mb-1'>
                Name
              </label>
              <input
                type='text'
                {...register('name', { required: 'Name is required' })}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-neutral-800'
                }`}
                placeholder='Tool name'
              />
              {errors.name && (
                <p className='mt-1 text-sm text-red-500'>{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-400 mb-1'>
                Link
              </label>
              <input
                type='url'
                {...register('link', { required: 'Link is required' })}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  errors.link ? 'border-red-500' : 'border-neutral-800'
                }`}
                placeholder='https://...'
              />
              {errors.link && (
                <p className='mt-1 text-sm text-red-500'>{errors.link.message}</p>
              )}
            </div>

            <div>
              <div className='flex justify-between items-center mb-1'>
                <label className='block text-sm font-medium text-gray-400'>
                  Description
                </label>
                <span
                  className={`text-sm ${
                    remainingChars < 0 ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  {remainingChars} characters remaining
                </span>
              </div>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  maxLength: {
                    value: 230,
                    message: 'Description cannot exceed 230 characters',
                  },
                })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  errors.description || remainingChars < 0
                    ? 'border-red-500'
                    : 'border-neutral-800'
                }`}
                placeholder='Tool description...'
              />
              {errors.description && (
                <p className='mt-1 text-sm text-red-500'>{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-400 mb-1'>
                Category
              </label>
              <select
                {...register('categoryID', { required: 'Category is required' })}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  errors.categoryID ? 'border-red-500' : 'border-neutral-800'
                }`}
              >
                <option value=''>Select a category</option>
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryID && (
                <p className='mt-1 text-sm text-red-500'>{errors.categoryID.message}</p>
              )}
            </div>

            <button
              type='submit'
              disabled={createTool.isPending || remainingChars < 0}
              className={`w-full bg-[#222] text-white py-2 px-4 rounded-md hover:opacity-50 focus:outline-hidden transition-colors cursor-pointer ${
                createTool.isPending || remainingChars < 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {createTool.isPending ? 'Creating...' : 'Create Tool'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateToolPage
