import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '../src/components/Navbar'

const push = vi.fn()
const logout = vi.fn()
let authState: {
  user: null | { githubId: number; name: string; avatar: string; role: 'USER' | 'ADMIN' }
  loading: boolean
} = { user: null, loading: false }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ ...authState, logout }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}))

vi.mock('../src/components/AddSuggestionModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid='suggestion-modal'>Suggestion Modal</div> : null,
}))

vi.mock('../src/components/Toast', () => ({
  Toast: ({ message }: { message: string }) => <div role='alert'>{message}</div>,
}))

describe('Navbar', () => {
  beforeEach(() => {
    authState = { user: null, loading: false }
    push.mockReset()
    logout.mockReset()
    process.env.NEXT_PUBLIC_URL_API = 'https://api.tools4.tech'
  })

  it('warns anonymous users instead of navigating to favorites', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Log in to access your favorites!',
    )
    expect(push).not.toHaveBeenCalled()
  })

  it('links anonymous users to GitHub OAuth on the API host', () => {
    render(<Navbar />)

    expect(screen.getByRole('link', { name: 'Log in with GitHub' })).toHaveAttribute(
      'href',
      'https://api.tools4.tech/auth/github',
    )
  })

  it('navigates authenticated users to favorites', () => {
    authState = {
      user: {
        githubId: 1,
        name: 'Mateus',
        avatar: 'https://example.com/avatar.png',
        role: 'USER',
      },
      loading: false,
    }

    render(<Navbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }))

    expect(push).toHaveBeenCalledWith('/favorites')
  })

  it('opens the suggestion modal for authenticated users', () => {
    authState = {
      user: {
        githubId: 1,
        name: 'Mateus',
        avatar: 'https://example.com/avatar.png',
        role: 'USER',
      },
      loading: false,
    }

    render(<Navbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Suggest a tool' }))

    expect(screen.getByTestId('suggestion-modal')).toBeInTheDocument()
  })
})
