import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnchorHTMLAttributes } from 'react'
import Navbar from '../src/components/Navbar'

const push = vi.fn()
const logout = vi.fn()
let pathname = '/'
let authState: {
  user: null | { githubId: number; name: string; avatar: string; role: 'USER' | 'ADMIN' }
  loading: boolean
} = { user: null, loading: false }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ ...authState, logout }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
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
    pathname = '/'
    authState = { user: null, loading: false }
    push.mockReset()
    logout.mockReset()
    process.env.NEXT_PUBLIC_URL_API = 'https://api.tools4.tech'
  })

  it('warns anonymous users instead of navigating to favorites', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /Favorites/ }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Log in to access your favorites!',
    )
    expect(push).not.toHaveBeenCalled()
  })

  it('links anonymous users to GitHub OAuth on the API host', () => {
    render(<Navbar />)

    expect(screen.getByRole('link', { name: /Log in with GitHub/ })).toHaveAttribute(
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
    fireEvent.click(screen.getByRole('button', { name: /Favorites/ }))

    expect(push).toHaveBeenCalledWith('/favorites')
  })

  it('opens the suggestion modal for anonymous users so the modal can handle sign-in', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /Suggest a tool/ }))

    expect(screen.getByTestId('suggestion-modal')).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: /Suggest a tool/ }))

    expect(screen.getByTestId('suggestion-modal')).toBeInTheDocument()
  })

  it('marks the current navigation item as active', () => {
    pathname = '/contributors'

    render(<Navbar />)

    expect(screen.getByRole('link', { name: 'Contributors' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Discover' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('closes the mobile menu with Escape', () => {
    render(<Navbar />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )
    expect(
      screen.getByRole('button', { name: 'Close navigation menu' }),
    ).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the minimal brand header on the login page', () => {
    pathname = '/login'

    render(<Navbar />)

    expect(screen.getByRole('link', { name: 'Tools4.tech' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.queryByRole('button', { name: /Favorites/ })).not.toBeInTheDocument()
  })

  it('shows the admin action inside the account menu for administrators', () => {
    authState = {
      user: {
        githubId: 1,
        name: 'Mateus',
        avatar: 'https://example.com/avatar.png',
        role: 'ADMIN',
      },
      loading: false,
    }

    render(<Navbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))

    expect(screen.getByRole('link', { name: 'Add a tool (admin)' })).toHaveAttribute(
      'href',
      '/admin/addtools',
    )
  })
})
