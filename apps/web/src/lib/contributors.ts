export type ContributorSortKey = 'contributions' | 'followers' | 'name'

export interface ContributorListItem {
  login: string
  contributions: number
  followers?: number | null
}

export function filterAndSortContributors<T extends ContributorListItem>(
  contributors: readonly T[],
  search: string,
  sortBy: ContributorSortKey,
): T[] {
  const normalizedSearch = search.trim().toLowerCase()

  return contributors
    .filter(contributor =>
      contributor.login.toLowerCase().includes(normalizedSearch),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'contributions':
          return b.contributions - a.contributions
        case 'followers':
          return (b.followers ?? 0) - (a.followers ?? 0)
        case 'name':
          return a.login.localeCompare(b.login)
      }
    })
}
