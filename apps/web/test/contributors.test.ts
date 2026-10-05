import { describe, expect, it } from 'vitest'
import { filterAndSortContributors } from '../src/lib/contributors'

const contributors = [
  { login: 'zeta', contributions: 4, followers: 20 },
  { login: 'AlphaDev', contributions: 12, followers: 5 },
  { login: 'beta', contributions: 7, followers: null },
]

describe('filterAndSortContributors', () => {
  it('sorts by contributions descending without mutating the input', () => {
    const input = [...contributors]

    const result = filterAndSortContributors(input, '', 'contributions')

    expect(result.map(item => item.login)).toEqual(['AlphaDev', 'beta', 'zeta'])
    expect(input.map(item => item.login)).toEqual(['zeta', 'AlphaDev', 'beta'])
  })

  it('filters case-insensitively and trims the search text', () => {
    const result = filterAndSortContributors(contributors, '  ALPHA  ', 'name')

    expect(result.map(item => item.login)).toEqual(['AlphaDev'])
  })

  it('sorts missing follower counts as zero', () => {
    const result = filterAndSortContributors(contributors, '', 'followers')

    expect(result.map(item => item.login)).toEqual(['zeta', 'AlphaDev', 'beta'])
  })

  it('sorts names alphabetically', () => {
    const result = filterAndSortContributors(contributors, '', 'name')

    expect(result.map(item => item.login)).toEqual(['AlphaDev', 'beta', 'zeta'])
  })
})
