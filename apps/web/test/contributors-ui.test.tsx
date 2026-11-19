import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardsContributors from '../src/components/CardsContributors'
import type { PublicContributor } from '../src/lib/public-contributors'

const mock = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mock.refresh }) }))

const contributors: PublicContributor[] = [
  { login: 'beta', avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4', isMaintainer: false, approvedCount: 2, sinceYear: 2026, lastApprovedAt: '2026-10-01T00:00:00Z', recentTools: ['Tailwind'] },
  { login: 'alpha', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', isMaintainer: true, approvedCount: 6, sinceYear: 2025, lastApprovedAt: '2026-06-01T00:00:00Z', recentTools: ['Astro', 'Next.js'] },
  { login: 'zeta', avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4', isMaintainer: false, approvedCount: 4, sinceYear: 2026, lastApprovedAt: '2026-11-01T00:00:00Z', recentTools: ['React'] },
]

describe('CardsContributors', () => {
  beforeEach(() => mock.refresh.mockReset())

  it('shows the approved-only ranking, maintainer, recent tool chips and GitHub avatars', () => {
    render(<CardsContributors data={contributors} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Contributors' })).toBeInTheDocument()
    expect(screen.getByText('maintainer')).toBeInTheDocument()
    expect(screen.getByText('Astro')).toBeInTheDocument()
    expect(screen.getByText('since 2025')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { hidden: true }).length).toBeGreaterThanOrEqual(3)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', 'https://github.com/alpha')
    expect(links[1]).toHaveAttribute('href', 'https://github.com/zeta')
  })

  it('changes segmented sorting to most recent and updates pressed state', () => {
    render(<CardsContributors data={contributors} />)
    const recent = screen.getByRole('button', { name: 'Most recent' })
    expect(recent).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(recent)
    expect(recent).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', 'https://github.com/zeta')
  })

  it('shows a genuine empty state and triggers the existing suggestion modal', () => {
    const listener = vi.fn()
    window.addEventListener('devhub:open-suggestion', listener)
    render(<CardsContributors data={[]} />)
    expect(screen.getByText('No approved contributions yet')).toBeInTheDocument()
    expect(screen.queryByText('Most approved')).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Suggest a tool' })[0])
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('devhub:open-suggestion', listener)
  })

  it('shows a retry state when the API is unavailable', () => {
    render(<CardsContributors data={[]} loadError />)
    expect(screen.getByRole('alert')).toHaveTextContent('Contributors unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(mock.refresh).toHaveBeenCalledOnce()
  })
})
