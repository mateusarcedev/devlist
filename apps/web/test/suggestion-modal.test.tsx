import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddSuggestionModal from '../src/components/AddSuggestionModal'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  mutate: vi.fn(),
  refetch: vi.fn(),
}))

let authUser: null | {
  githubId: number
  name: string
  avatar: string
  role: 'USER' | 'ADMIN'
} = null

let queryState = {
  data: [{ id: 'cat-testing', name: 'Testing' }],
  isLoading: false,
  isError: false,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: authUser }),
}))

vi.mock('@/hooks/useSubmitSuggestion', () => ({
  useSubmitSuggestion: () => ({
    mutate: mocks.mutate,
    isPending: false,
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    ...queryState,
    refetch: mocks.refetch,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

describe('AddSuggestionModal', () => {
  beforeEach(() => {
    authUser = null
    queryState = {
      data: [{ id: 'cat-testing', name: 'Testing' }],
      isLoading: false,
      isError: false,
    }
    mocks.push.mockReset()
    mocks.mutate.mockReset()
    mocks.refetch.mockReset()
  })

  it('shows the sign-in state for anonymous users', () => {
    const onClose = vi.fn()
    render(<AddSuggestionModal isOpen onClose={onClose} />)

    expect(
      screen.getByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(onClose).toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith('/login')
  })

  it('submits the real suggestion payload for authenticated users', () => {
    authUser = {
      githubId: 1,
      name: 'Mateus Arce',
      avatar: 'https://example.com/avatar.png',
      role: 'USER',
    }

    render(<AddSuggestionModal isOpen onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Tool name'), {
      target: { value: 'Playwright' },
    })
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'https://playwright.dev' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'End-to-end testing for modern web apps.' },
    })
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'cat-testing' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit suggestion' }))

    expect(mocks.mutate).toHaveBeenCalledWith({
      name: 'Playwright',
      link: 'https://playwright.dev',
      description: 'End-to-end testing for modern web apps.',
      categoryId: 'cat-testing',
    })
  })

  it('shows category loading failure with a retry action', () => {
    authUser = {
      githubId: 1,
      name: 'Mateus Arce',
      avatar: 'https://example.com/avatar.png',
      role: 'USER',
    }
    queryState = { data: [], isLoading: false, isError: true }

    render(<AddSuggestionModal isOpen onClose={vi.fn()} />)

    expect(screen.getByText("Couldn't load categories.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(mocks.refetch).toHaveBeenCalled()
  })
})
