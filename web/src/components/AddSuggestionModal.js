import { AxiosConfig, getClientSessionToken } from '@/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

async function fetchCategories() {
  const { data } = await AxiosConfig.get('/categories')
  return data
}

export default function AddSuggestionModal({ isOpen, onClose, onSubmit }) {
  const { data: session, status } = useSession()
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isSelectOpen, setIsSelectOpen] = useState(false)

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isOpen,
  })

  const mutation = useMutation({
    mutationFn: async ({ suggestionData, token }) => {
      const response = await AxiosConfig.post('/suggestions', suggestionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data
    },
    onSuccess: data => {
      setName('')
      setLink('')
      setDescription('')
      setCategoryId('')

      onClose()

      onSubmit?.({ status: 'success', data })
    },
    onError: error => {
      console.error('Error creating suggestion:', error)
      onSubmit?.({
        status: 'error',
        message:
          error.message === 'Missing authentication token'
            ? 'Please log in again to submit a suggestion.'
            : error.response?.data?.message ||
              'Error sending suggestion. Please try again.',
      })
    },
  })

  const handleSubmit = e => {
    e.preventDefault()

    if (status !== 'authenticated' || !session?.user?.githubId) {
      console.error('User not authenticated')
      return
    }

    const token = getClientSessionToken()

    if (!token) {
      console.error('Authentication token not found')
      onSubmit?.({
        status: 'error',
        message: 'Please log in again to submit a suggestion.',
      })
      return
    }

    const suggestionData = {
      name,
      link,
      description,
      categoryId,
    }

    mutation.mutate({ suggestionData, token })
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setIsSelectOpen(false)
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  if (status === 'unauthenticated') {
    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
        <div className='bg-zinc-900 rounded-lg w-full max-w-md p-6 text-center'>
          <h2 className='text-xl font-semibold text-white mb-4'>
            Login Required
          </h2>
          <p className='text-zinc-300 mb-4'>
            You need to be logged in to submit a suggestion.
          </p>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-zinc-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 flex justify-between items-center p-6 border-b border-zinc-700 bg-zinc-900'>
          <h2 className='text-xl font-semibold text-white'>Add Suggestion</h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-zinc-800 rounded-lg transition-colors'
          >
            <X className='h-6 w-6 text-zinc-400' />
          </button>
        </div>
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div className='flex items-center space-x-3 p-3 bg-zinc-800 rounded-lg'>
            <img
              src={session?.user?.avatar_url}
              alt={session?.user?.name}
              className='w-8 h-8 rounded-full'
            />
            <div className='text-sm'>
              <p className='text-white font-medium'>{session?.user?.name}</p>
              <p className='text-zinc-400'>{session?.user?.email}</p>
            </div>
          </div>

          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-zinc-300 mb-1'
            >
              Tool Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className='w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-600'
              required
              disabled={mutation.isPending}
            />
          </div>

          <div>
            <label
              htmlFor='link'
              className='block text-sm font-medium text-zinc-300 mb-1'
            >
              Link
            </label>
            <input
              id='link'
              type='url'
              value={link}
              onChange={e => setLink(e.target.value)}
              className='w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-600'
              required
              disabled={mutation.isPending}
            />
          </div>

          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-zinc-300 mb-1'
            >
              Description
            </label>
            <textarea
              id='description'
              value={description}
              onChange={e => setDescription(e.target.value)}
              className='w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white resize-none focus:outline-hidden focus:ring-2 focus:ring-zinc-600'
              rows={4}
              maxLength={230}
              required
              disabled={mutation.isPending}
            />
            <p className='text-xs text-zinc-400 mt-1'>
              {description.length}/230 characters
            </p>
          </div>

          <div className='relative'>
            <label
              htmlFor='category'
              className='block text-sm font-medium text-zinc-300 mb-1'
            >
              Category
            </label>
            <button
              type='button'
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className='w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-left focus:outline-hidden focus:ring-2 focus:ring-zinc-600'
              disabled={mutation.isPending}
            >
              {categoryId
                ? categories?.find(cat => cat.id === categoryId)?.name
                : 'Select a category'}
            </button>
            {isSelectOpen && (
              <div className='absolute w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto z-50'>
                {isLoading ? (
                  <div className='px-3 py-2 text-zinc-400'>
                    Loading categories...
                  </div>
                ) : error ? (
                  <div className='px-3 py-2 text-zinc-400'>
                    Error loading categories
                  </div>
                ) : (
                  categories?.map(category => (
                    <button
                      key={category.id}
                      type='button'
                      className='w-full px-3 py-2 text-left hover:bg-zinc-700 text-white'
                      onClick={() => {
                        setCategoryId(category.id)
                        setIsSelectOpen(false)
                      }}
                    >
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type='submit'
            className='w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isLoading || error || mutation.isPending}
          >
            {mutation.isPending ? 'Sending...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  )
}
