import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardsContributors from '../src/components/CardsContributors'
import type { GitHubCodeContributor } from '../src/lib/github-code-contributors'
import type { PublicContributor } from '../src/lib/public-contributors'

const mock = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mock.refresh }) }))

const contributors: PublicContributor[] = [
  { login: 'beta', avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4', isMaintainer: false, approvedCount: 2, sinceYear: 2026, lastApprovedAt: '2026-10-01T00:00:00Z', recentTools: ['Tailwind'] },
  { login: 'alpha', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', isMaintainer: true, approvedCount: 6, sinceYear: 2025, lastApprovedAt: '2026-06-01T00:00:00Z', recentTools: ['Astro', 'Next.js'] },
  { login: 'zeta', avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4', isMaintainer: false, approvedCount: 4, sinceYear: 2026, lastApprovedAt: '2026-11-01T00:00:00Z', recentTools: ['React'] },
]
const code: GitHubCodeContributor[] = [
  { login: 'gamma', avatarUrl: 'https://avatars.githubusercontent.com/u/8?v=4', profileUrl: 'https://github.com/gamma', commits: 12 },
  { login: 'alpha', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', profileUrl: 'https://github.com/alpha', commits: 3 },
]

describe('CardsContributors', () => {
  beforeEach(() => mock.refresh.mockReset())

  it('shows approved rankings, maintainer and recent approved tool chips', () => {
    render(<CardsContributors data={contributors} codeContributors={code} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Contributors' })).toBeInTheDocument()
    expect(screen.getByText('maintainer')).toBeInTheDocument()
    expect(screen.getByText('Astro')).toBeInTheDocument()
    expect(screen.getByText('since 2025')).toBeInTheDocument()
    expect(document.querySelectorAll('img')).toHaveLength(5)

    const catalog = within(screen.getByRole('region', { name: 'Tool contributors' }))
    const links = catalog.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', 'https://github.com/alpha')
    expect(links[1]).toHaveAttribute('href', 'https://github.com/zeta')
  })

  it('changes tool sorting to most recent independently of code commits', () => {
    render(<CardsContributors data={contributors} codeContributors={code} />)
    const recent = screen.getByRole('button', { name: 'Most recent' })
    expect(recent).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(recent)
    expect(recent).toHaveAttribute('aria-pressed', 'true')
    const catalog = within(screen.getByRole('region', { name: 'Tool contributors' }))
    expect(catalog.getAllByRole('link')[0]).toHaveAttribute('href', 'https://github.com/zeta')
    const github = within(screen.getByRole('region', { name: 'Code contributors' }))
    expect(github.getAllByRole('link')[0]).toHaveAttribute('href', 'https://github.com/gamma')
  })

  it('shows GitHub commit authors even when the tool credit migration is absent', () => {
    render(<CardsContributors data={[]} loadError codeContributors={code} />)
    const github = within(screen.getByRole('region', { name: 'Code contributors' }))
    expect(github.getByText('@gamma')).toBeInTheDocument()
    expect(github.getByText('12')).toBeInTheDocument()
    const catalog = within(screen.getByRole('region', { name: 'Tool contributors' }))
    expect(catalog.getByText('Contributors unavailable')).toBeInTheDocument()
  })

  it('renders empty tool contributions and keeps the suggestion CTA functional', () => {
    const listener = vi.fn()
    window.addEventListener('devhub:open-suggestion', listener)
    render(<CardsContributors data={[]} codeContributors={code} />)
    expect(screen.getByText('No approved contributions yet')).toBeInTheDocument()
    expect(screen.queryByText('Most approved')).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Suggest a tool' })[0])
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('devhub:open-suggestion', listener)
  })

  it('retains a separate GitHub error while showing catalog credits', () => {
    render(<CardsContributors data={contributors} codeLoadError />)
    expect(screen.getByText('Could not load GitHub contributors right now. Approved suggestions below remain available.')).toBeInTheDocument()
    expect(screen.getByText('Astro')).toBeInTheDocument()
  })

  it('allows retry for catalog errors', () => {
    render(<CardsContributors data={[]} loadError />)
    const catalog = within(screen.getByRole('region', { name: 'Tool contributors' }))
    expect(catalog.getByRole('alert')).toHaveTextContent('Contributors unavailable')
    fireEvent.click(catalog.getByRole('button', { name: 'Try again' }))
    expect(mock.refresh).toHaveBeenCalledOnce()
  })
})
