import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AnchorHTMLAttributes } from 'react'
import DiscoverContent from '../src/components/DiscoverContent'

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
    const search = screen.getByRole('searchbox', { name: 'Search tools' })

    fireEvent.change(search, { target: { value: 'browser' } })
    expect(screen.getByText(/Playwright — Testing/)).toBeInTheDocument()
    expect(screen.queryByText(/React — Frontend/)).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'frontend' } })
    expect(screen.getByText(/React — Frontend/)).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'react.dev' } })
    expect(screen.getByText(/React — Frontend/)).toBeInTheDocument()
  })

  it('shows a retry state when the directory fails to load', () => {
    render(
      <DiscoverContent tools={[]} categories={[]} loadError />,
    )

    expect(
      screen.getByText("We couldn't load the directory"),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('shows the empty state when no tool matches', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tools' }), {
      target: { value: 'does-not-exist' },
    })

    expect(screen.getByText('No tools match')).toBeInTheDocument()
    expect(
      screen.getByText('Try a different search or category.'),
    ).toBeInTheDocument()
  })

  it('links the selected category to its full page', () => {
    render(<DiscoverContent tools={tools} categories={categories} />)

    fireEvent.click(screen.getByRole('button', { name: 'Frontend' }))

    expect(
      screen.getByRole('link', {
        name: 'View Frontend as a full category page →',
      }),
    ).toHaveAttribute('href', '/tools/Frontend')
  })
})
