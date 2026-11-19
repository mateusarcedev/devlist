import { describe, expect, it } from 'vitest'
import { sortContributors } from '../src/lib/contributors'
import type { PublicContributor } from '../src/lib/public-contributors'

const people: PublicContributor[] = [
  { login: 'beta', avatarUrl: '', isMaintainer: false, approvedCount: 2, sinceYear: 2026, lastApprovedAt: '2026-10-01T00:00:00Z', recentTools: ['Tool B'] },
  { login: 'alpha', avatarUrl: '', isMaintainer: true, approvedCount: 6, sinceYear: 2025, lastApprovedAt: '2026-06-01T00:00:00Z', recentTools: ['Tool A'] },
  { login: 'zeta', avatarUrl: '', isMaintainer: false, approvedCount: 4, sinceYear: 2026, lastApprovedAt: '2026-11-01T00:00:00Z', recentTools: ['Tool C'] },
]

describe('sortContributors', () => {
  it('sorts by approved count by default without mutating input', () => {
    expect(sortContributors(people, 'approved').map(p => p.login)).toEqual(['alpha', 'zeta', 'beta'])
    expect(people.map(p => p.login)).toEqual(['beta', 'alpha', 'zeta'])
  })

  it('sorts by latest approval timestamp', () => {
    expect(sortContributors(people, 'recent').map(p => p.login)).toEqual(['zeta', 'beta', 'alpha'])
  })

  it('breaks exact ties by GitHub login for stable order', () => {
    const tied = people.map(person => ({ ...person, approvedCount: 1, lastApprovedAt: '2026-11-01T00:00:00Z' }))
    expect(sortContributors(tied, 'approved').map(p => p.login)).toEqual(['alpha', 'beta', 'zeta'])
  })
})
