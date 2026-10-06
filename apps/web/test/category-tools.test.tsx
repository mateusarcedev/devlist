import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AnchorHTMLAttributes } from 'react'
import CategoryToolsContent from '../src/app/tools/[slug]/CategoryToolsContent'

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

const tools = [
  {
    id: 'tool-motion',
    name: 'Motion',
    link: 'https://motion.dev',
    description: 'Animation library for modern web interfaces',
    categoryId: 'cat-animation',
  },
  {
    id: 'tool-gsap',
    name: 'GSAP',
    link: 'https://gsap.com',
    description: 'Professional-grade JavaScript animation',
    categoryId: 'cat-animation',
  },
]

describe('CategoryToolsContent', () => {
  it('renders the category header, count, and tool cards', () => {
    render(
      <CategoryToolsContent categoryName='Animation' tools={tools} />,
    )

    expect(screen.getByRole('heading', { name: 'Animation' })).toBeInTheDocument()
    expect(screen.getByText('2 tools')).toBeInTheDocument()
    expect(screen.getByText(/Motion — Animation/)).toBeInTheDocument()
    expect(screen.getByText(/GSAP — Animation/)).toBeInTheDocument()
  })

  it('filters tools by name, description, and domain', () => {
    render(
      <CategoryToolsContent categoryName='Animation' tools={tools} />,
    )

    const search = screen.getByRole('searchbox', {
      name: 'Search Animation tools',
    })

    fireEvent.change(search, { target: { value: 'professional' } })
    expect(screen.getByText(/GSAP — Animation/)).toBeInTheDocument()
    expect(screen.queryByText(/Motion — Animation/)).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'motion.dev' } })
    expect(screen.getByText(/Motion — Animation/)).toBeInTheDocument()
  })

  it('shows the search empty state', () => {
    render(
      <CategoryToolsContent categoryName='Animation' tools={tools} />,
    )

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search Animation tools' }),
      { target: { value: 'no-match' } },
    )

    expect(screen.getByText('No tools match your search')).toBeInTheDocument()
    expect(screen.getByText('Try a different search term.')).toBeInTheDocument()
  })

  it('shows the category empty state when there are no tools', () => {
    render(<CategoryToolsContent categoryName='Animation' tools={[]} />)

    expect(screen.getByText('No tools in this category yet')).toBeInTheDocument()
    expect(screen.getByText('Be the first to suggest one.')).toBeInTheDocument()
  })

  it('shows a retry action when loading the category failed', () => {
    refresh.mockClear()

    render(
      <CategoryToolsContent
        categoryName='Animation'
        tools={[]}
        loadError
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
