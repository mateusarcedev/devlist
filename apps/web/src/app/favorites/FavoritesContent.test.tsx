import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Favorite, OnFavoriteChange, Tool } from '@/types'
import FavoritesContent from './FavoritesContent'

vi.mock('@/components/Card', () => ({
  default: ({
    tool,
    onFavoriteChange,
  }: {
    tool: Tool
    onFavoriteChange?: OnFavoriteChange
  }) => (
    <button onClick={() => onFavoriteChange?.(tool.id, false)}>
      {tool.name}
    </button>
  ),
}))

const favorites: Favorite[] = [
  {
    id: 'favorite-1',
    userId: '42',
    toolId: 'tool-1',
    tool: {
      id: 'tool-1',
      name: 'Vitest',
      link: 'https://vitest.dev',
      description: 'Testing framework',
      categoryId: 'testing',
    },
  },
  {
    id: 'favorite-2',
    userId: '42',
    toolId: 'tool-2',
    tool: {
      id: 'tool-2',
      name: 'Playwright',
      link: 'https://playwright.dev',
      description: 'Browser automation',
      categoryId: 'testing',
    },
  },
]

describe('FavoritesContent', () => {
  it('renders the favorite tools received from the server', () => {
    render(<FavoritesContent initialFavorites={favorites} />)

    expect(screen.getByText('Vitest')).not.toBeNull()
    expect(screen.getByText('Playwright')).not.toBeNull()
    expect(screen.getByText('My Favorites')).not.toBeNull()
  })

  it('removes cards locally and shows the empty state after the last removal', () => {
    render(<FavoritesContent initialFavorites={favorites} />)

    fireEvent.click(screen.getByRole('button', { name: 'Vitest' }))
    expect(screen.queryByText('Vitest')).toBeNull()
    expect(screen.getByText('Playwright')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Playwright' }))
    expect(screen.getByText('No favorites found')).not.toBeNull()
  })
})
