import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CardsContributors from '../src/components/CardsContributors'

const contributors = [
  {
    login: 'zeta-dev',
    avatar_url: 'https://example.com/zeta.png',
    name: 'Zeta Dev',
    followers: 20,
    public_repos: 10,
    contributions: 4,
  },
  {
    login: 'alpha',
    avatar_url: 'https://example.com/alpha.png',
    name: 'Alpha',
    followers: 5,
    public_repos: 2,
    contributions: 12,
  },
]

describe('CardsContributors', () => {
  it('renders contributors sorted by contributions by default', () => {
    render(<CardsContributors data={contributors} />)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', 'https://github.com/alpha')
    expect(links[1]).toHaveAttribute('href', 'https://github.com/zeta-dev')
  })

  it('filters contributors and shows the empty state', () => {
    render(<CardsContributors data={contributors} />)

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search contributors' }),
      { target: { value: 'missing' } },
    )

    expect(screen.getByText('No contributors found')).toBeInTheDocument()
    expect(screen.getByText('No one matches "missing".')).toBeInTheDocument()
  })

  it('sorts contributors by followers', () => {
    render(<CardsContributors data={contributors} />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort contributors' }), {
      target: { value: 'followers' },
    })

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', 'https://github.com/zeta-dev')
  })
})
