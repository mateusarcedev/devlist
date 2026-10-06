import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnchorHTMLAttributes } from 'react'
import FavoritesAccessState from '../src/app/favorites/FavoritesAccessState'
import FavoritesContent from '../src/app/favorites/FavoritesContent'

const replace = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../src/components/DirectoryToolCard', () => ({
  default: ({
    tool,
    onFavoriteChange,
  }: {
    tool: { id: string; name: string }
    onFavoriteChange?: (toolId: string, isFavorite: boolean) => void
  }) => (
    <div data-testid='favorite-card'>
      <span>{tool.name}</span>
      <button
        type='button'
        onClick={() => onFavoriteChange?.(tool.id, false)}
      >
        Remove {tool.name}
      </button>
    </div>
  ),
}))

const favorites = [
  {
    id: 'fav-1',
    userId: '1',
    toolId: 'tool-react',
    tool: {
      id: 'tool-react',
      name: 'React',
      link: 'https://react.dev',
      description: 'Library for interfaces',
      categoryId: 'cat-frontend',
    },
  },
  {
    id: 'fav-2',
    userId: '1',
    toolId: 'tool-playwright',
    tool: {
      id: 'tool-playwright',
      name: 'Playwright',
      link: 'https://playwright.dev',
      description: 'Browser testing',
      categoryId: 'cat-testing',
    },
  },
]

describe('FavoritesContent', () => {
  it('renders the saved count and favorites', () => {
    render(<FavoritesContent initialFavorites={favorites} />)

    expect(screen.getByText('2 saved tools')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Playwright')).toBeInTheDocument()
  })

  it('removes a tool immediately after it is unfavorited', () => {
    render(<FavoritesContent initialFavorites={favorites} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove React' }))

    expect(screen.queryByText('React')).not.toBeInTheDocument()
    expect(screen.getByText('1 saved tool')).toBeInTheDocument()
  })

  it('shows the empty collection state', () => {
    render(<FavoritesContent initialFavorites={[]} />)

    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
    expect(screen.getByText('Save tools you want to come back to.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Discover tools' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

describe('FavoritesAccessState', () => {
  beforeEach(() => {
    replace.mockClear()
    refresh.mockClear()
    vi.restoreAllMocks()
  })

  it('shows the signed-out state with a login action', () => {
    render(<FavoritesAccessState state='signed-out' />)

    expect(
      screen.getByRole('heading', { name: 'Sign in to see your favorites' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Continue with GitHub' }),
    ).toHaveAttribute('href', '/login')
  })

  it('shows a retry action for generic loading failures', () => {
    render(<FavoritesAccessState state='load-error' />)

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
