import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from './Navbar'
import type { AuthUser } from '@/contexts/auth-context'

const pushMock = vi.fn()
const logoutMock = vi.fn()

let authState: {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
} = {
  user: null,
  loading: false,
  logout: logoutMock,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('./AddSuggestionModal', () => ({
  default: () => null,
}))

describe('Navbar', () => {
  beforeEach(() => {
    pushMock.mockReset()
    logoutMock.mockReset()
    authState = {
      user: null,
      loading: false,
      logout: logoutMock,
    }
    process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001'
  })

  it('asks a guest to log in instead of opening favorites', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }))

    expect(screen.getByText('Log in to access your favorites!')).not.toBeNull()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('routes an authenticated user to favorites', () => {
    authState = {
      user: {
        githubId: 42,
        name: 'Mateus',
        avatar: 'https://example.com/avatar.png',
        role: 'USER',
      },
      loading: false,
      logout: logoutMock,
    }

    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }))

    expect(pushMock).toHaveBeenCalledWith('/favorites')
  })

  it('exposes GitHub OAuth as a normal external navigation for guests', () => {
    render(<Navbar />)

    const loginLink = screen.getByRole('link', { name: 'Log in with GitHub' })

    expect(loginLink.getAttribute('href')).toBe(
      'http://localhost:3001/auth/github',
    )
  })
})
