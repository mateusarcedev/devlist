import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateToolPage from '../src/app/admin/addtools/page'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  invalidateQueries: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      githubId: 1,
      name: 'Mateus',
      avatar: 'https://example.com/avatar.png',
      role: 'ADMIN',
    },
    loading: false,
  }),
}))

vi.mock('@/utils', () => ({
  AxiosConfig: {
    post: mocks.post,
    get: vi.fn(),
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
  useQuery: () => ({
    data: [{ id: 'cat-frontend', name: 'Frontend' }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useMutation: ({
    mutationFn,
    onSuccess,
    onError,
  }: {
    mutationFn: (data: unknown) => Promise<unknown>
    onSuccess?: () => void
    onError?: (error: unknown) => void
  }) => ({
    isPending: false,
    mutate: async (data: unknown) => {
      try {
        await mutationFn(data)
        onSuccess?.()
      } catch (error) {
        onError?.(error)
      }
    },
  }),
}))

describe('CreateToolPage', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.invalidateQueries.mockReset()
    mocks.post.mockResolvedValue({ data: { id: 'tool-1' } })
  })

  it('submits categoryId using the API contract', async () => {
    render(<CreateToolPage />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Motion' },
    })
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'https://motion.dev' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Animation library for modern web interfaces.' },
    })
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'cat-frontend' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create tool' }))

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith('/tools', {
        name: 'Motion',
        link: 'https://motion.dev',
        description: 'Animation library for modern web interfaces.',
        categoryId: 'cat-frontend',
      }),
    )
  })
})
