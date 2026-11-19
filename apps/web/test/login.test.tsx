import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginContent } from '../src/app/login/page'

const signInWithOAuth = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
let errorParam: string | null = null

vi.mock('@/lib/supabase/browser', () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'error' ? errorParam : null),
  }),
}))

describe('LoginContent', () => {
  beforeEach(() => {
    errorParam = null
    signInWithOAuth.mockClear()
  })

  it('starts Supabase GitHub OAuth and explains privacy', async () => {
    render(<LoginContent />)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Continue with GitHub/ }))
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    }))
    expect(screen.getByText(/GitHub profile is used/)).toBeInTheDocument()
  })

  it('shows a provider authentication failure', () => {
    errorParam = 'auth_failed'
    render(<LoginContent />)
    expect(screen.getByRole('alert')).toHaveTextContent('Authentication failed. Please try again.')
  })

  it('does not show an error for other query values', () => {
    errorParam = 'other'
    render(<LoginContent />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
