import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AnchorHTMLAttributes } from 'react'
import DiscoverContent from '../src/components/DiscoverContent'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
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
    categoryName,
  }: {
    tool: { name: string }
    categoryName?: string
  }) => (
    <div data-testid='tool-card'>
      {tool.name}
      {categoryName ? ` — ${categoryName}` : ''}
    </div>
  ),
}))

const categories = [
  { id: 'cat-frontend', name: 'Frontend' },
  { id: 'cat-testing', name: 'Testing' },
]

const tools = [
  {
    id: 'tool-react',
    name: 'React',
    link: 'https://react.dev',
    description: 'Library for building user interfaces',
    categoryId: 'cat-frontend',
  },
  {
    id: 'tool-playwright',
    name: 'Playwright',
    link: 'https://playwright.dev',
    description: 'End-to-end browser testing',
    categoryId: 'cat-testing',
  },
]

describe('DiscoverContent', () => {
  it('shows all tools initially', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    expect(screen.getByText(/React — Frontend/)).toBeInTheDocument()
    expect(screen.getByText(/Playwright — Testing/)).toBeInTheDocument()
    expect(screen.getByText('All tools')).toBeInTheDocument()
  })

  it('filters tools by category chip', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    fireEvent.click(screen.getByRole('button', { name: 'Testing' }))

    expect(screen.queryByText(/React — Frontend/)).not.toBeInTheDocument()
    expect(screen.getByText(/Playwright — Testing/)).toBeInTheDocument()
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('filters tools by name, description, category, or domain', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)
    const search = screen.getByRole('searchbox', {
      name: 'Search tools, categories, technologies...',
    })

    fireEvent.change(search, { target: { value: 'browser' } })
    expect(screen.getByText(/Playwright — Testing/)).toBeInTheDocument()
    expect(screen.queryByText(/React — Frontend/)).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'frontend' } })
    expect(screen.getByText(/React — Frontend/)).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'react.dev' } })
    expect(screen.getByText(/React — Frontend/)).toBeInTheDocument()
  })

  it('renders only 24 cards initially and reveals more on demand', () => {
    const manyTools = Array.from({ length: 61 }, (_, index) => ({
      id: `tool-${index}`,
      name: `Tool ${index}`,
      link: `https://example.com/tool-${index}`,
      description: `Description ${index}`,
      categoryId: 'cat-frontend',
    }))
    render(<DiscoverContent tools={manyTools} categories={categories} />)
    expect(screen.getAllByTestId('tool-card')).toHaveLength(24)
    expect(screen.getByText('Showing 24 of 61 tools')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(screen.getAllByTestId('tool-card')).toHaveLength(48)

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(screen.getAllByTestId('tool-card')).toHaveLength(61)
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('resets the visible page when the search changes', () => {
    const manyTools = Array.from({ length: 35 }, (_, index) => ({
      id: `tool-${index}`,
      name: `Tool ${index}`,
      link: `https://example.com/tool-${index}`,
      description: 'Library',
      categoryId: 'cat-frontend',
    }))
    render(<DiscoverContent tools={manyTools} categories={categories} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(screen.getAllByTestId('tool-card')).toHaveLength(35)
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search tools, categories, technologies...' }),
      { target: { value: 'Tool' } },
    )
    expect(screen.getAllByTestId('tool-card')).toHaveLength(35)
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('shows a retry state when the directory fails to load', () => {
    render(<DiscoverContent tools={[]} categories={[]} loadError />)

    expect(
      screen.getByText("We couldn't load the directory"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('shows the empty state when no tool matches', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search tools, categories, technologies...',
      }),
      {
        target: { value: 'does-not-exist' },
      },
    )

    expect(screen.getByText('Nothing found')).toBeInTheDocument()
    expect(
      screen.getByText('Try another search or category. Missing a tool? Suggest it to the community.'),
    ).toBeInTheDocument()
  })

  it('focuses the search with Ctrl+K and keeps categories in a sidebar', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)
    const search = screen.getByRole('searchbox', {
      name: 'Search tools, categories, technologies...',
    })
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(search).toHaveFocus()

    const sidebar = screen.getByRole('complementary', { name: 'Categories' })
    expect(sidebar).toContainElement(screen.getByRole('button', { name: 'Testing' }))
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Testing' }))
    expect(screen.getByRole('button', { name: 'Testing' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers a compact mobile category picker synchronized with the desktop sidebar', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    const picker = screen.getByRole('combobox', { name: 'Categories' })
    expect(picker).toHaveValue('all')
    expect(picker).toHaveClass('appearance-none')

    fireEvent.change(picker, { target: { value: 'cat-testing' } })
    expect(picker).toHaveValue('cat-testing')
    expect(screen.getByRole('button', { name: 'Testing' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Playwright — Testing/)).toBeInTheDocument()
    expect(screen.queryByText(/React — Frontend/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(picker).toHaveValue('all')
    expect(screen.getByText(/React — Frontend/)).toBeInTheDocument()
  })

  it('uses a wider catalog and keeps the desktop category sidebar hidden on mobile', () => {
    const { container } = render(<DiscoverContent tools={tools} categories={categories} />)
    expect(container.querySelector('main')).toHaveClass('max-w-[1600px]')
    expect(screen.getByRole('complementary', { name: 'Categories' })).toHaveClass('hidden', 'laptop:flex')
  })

  it('opens the existing suggestion modal from the empty state', () => {
    const listener = vi.fn()
    window.addEventListener('devhub:open-suggestion', listener)
    render(<DiscoverContent tools={[]} categories={categories} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Suggest a tool' })[0])
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('devhub:open-suggestion', listener)
  })

  it('links the selected category to its full page', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    fireEvent.click(screen.getByRole('button', { name: 'Frontend' }))

    expect(
      screen.getByRole('link', {
        name: 'View full category: Frontend',
      }),
    ).toHaveAttribute('href', '/tools/Frontend')
  })
  it('pre-filters the catalog for SearchAction URLs with ?q=', () => {
    render(<DiscoverContent tools={tools} categories={categories} initialQuery='browser' />)
    expect(screen.getByRole('searchbox', {name:'Search tools, categories, technologies...'})).toHaveValue('browser')
    expect(screen.queryByText(/React — Frontend/)).not.toBeInTheDocument()
    expect(screen.getByText(/Playwright — Testing/)).toBeInTheDocument()
  })


})
