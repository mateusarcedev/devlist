import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginContent } from '../src/app/login/page'

let errorParam: string | null = null

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'error' ? errorParam : null),
  }),
}))

describe('LoginContent', () => {
  beforeEach(() => {
    errorParam = null
    process.env.NEXT_PUBLIC_URL_API = 'https://api.tools4.tech'
  })

  it('renders the GitHub OAuth action and privacy note', () => {
    render(<LoginContent />)

    expect(
      screen.getByRole('heading', { name: 'Sign in to Tools4.tech' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Continue with GitHub/ }),
    ).toHaveAttribute('href', 'https://api.tools4.tech/auth/github')
    expect(
      screen.getByText(/We only request your public GitHub profile/),
    ).toBeInTheDocument()
  })

  it('shows the authentication failure state', () => {
    errorParam = 'auth_failed'

    render(<LoginContent />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Authentication failed. Please try again.',
    )
  })

  it('does not show an error for unrelated query values', () => {
    errorParam = 'other'

    render(<LoginContent />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
