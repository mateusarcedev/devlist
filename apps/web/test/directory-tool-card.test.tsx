import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DirectoryToolCard from '../src/components/DirectoryToolCard'

vi.mock('@/hooks/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toast: null,
    setToast: vi.fn(),
    toggle: vi.fn(),
    isAuthLoading: false,
  }),
}))

vi.mock('@/contexts/i18n-context', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('DirectoryToolCard', () => {
  it('shows a clear badge for each access model', () => {
    const tool = { id: 'x', name: 'Example', link: 'https://example.com', description: 'Description', categoryId: 'c' }
    const { rerender } = render(<DirectoryToolCard tool={{ ...tool, accessModel: 'OPEN_SOURCE' }} />)
    expect(screen.getByText('accessOpenSource')).toBeInTheDocument()
    rerender(<DirectoryToolCard tool={{ ...tool, accessModel: 'FREEMIUM' }} />)
    expect(screen.getByText('accessFreemium')).toBeInTheDocument()
    rerender(<DirectoryToolCard tool={{ ...tool, accessModel: 'UNVERIFIED' }} />)
    expect(screen.getByText('accessUnverified')).toBeInTheDocument()
  })

  it('shows the entire description without line clamping, even for long text', () => {
    const description = 'A complete description of a development tool that spans several lines and explains all of its features, use cases, integrations, and technical capabilities without hiding any of the original content.'

    render(<DirectoryToolCard tool={{
      id: 'tool-1',
      name: 'Example tool',
      link: 'https://example.com',
      description,
      categoryId: 'category-1',
    }} categoryName='Development' />)

    const paragraph = screen.getByText(description)
    expect(paragraph).toBeVisible()
    expect(paragraph.className).not.toMatch(/line-clamp|truncate|overflow-hidden|max-h-/)
    expect(paragraph).toHaveClass('whitespace-normal', '[overflow-wrap:anywhere]')
    expect(paragraph.closest('article')).toHaveClass('min-h-[176px]')
    expect(paragraph.closest('article')).not.toHaveClass('h-[176px]')
  })
})
