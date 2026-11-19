import type { ContributorSort, PublicContributor } from '@/lib/public-contributors'

export function sortContributors(contributors: readonly PublicContributor[], order: ContributorSort): PublicContributor[] {
  return [...contributors].sort((a, b) => {
    if (order === 'recent') {
      const recent = Date.parse(b.lastApprovedAt) - Date.parse(a.lastApprovedAt)
      if (recent !== 0) return recent
      if (b.approvedCount !== a.approvedCount) return b.approvedCount - a.approvedCount
    } else {
      if (b.approvedCount !== a.approvedCount) return b.approvedCount - a.approvedCount
      const recent = Date.parse(b.lastApprovedAt) - Date.parse(a.lastApprovedAt)
      if (recent !== 0) return recent
    }
    return a.login.localeCompare(b.login)
  })
}
