/** GitHub's repository contributors API counts authored commits on the default branch.
 * This is independent from approved DevHub tool suggestions.
 */
export interface GitHubCodeContributor {
  login: string
  avatarUrl: string
  profileUrl: string
  commits: number
}

interface GitHubContributorResponse {
  id?: number
  login?: string
  type?: string
  contributions?: number
}

export async function fetchGitHubCodeContributors(): Promise<GitHubCodeContributor[]> {
  const token = process.env.GITHUB_TOKEN
  const response = await fetch(
    'https://api.github.com/repos/mateusarcedev/devlist/contributors?per_page=100&anon=false',
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    },
  )
  // 202 means GitHub is computing repository statistics; do not show invented data.
  if (!response.ok) throw new Error('GitHub contributor statistics unavailable')
  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) throw new Error('Unexpected GitHub contributors response')

  return (payload as GitHubContributorResponse[])
    .filter((entry): entry is Required<Pick<GitHubContributorResponse, 'login' | 'id' | 'contributions'>> & GitHubContributorResponse =>
      typeof entry.login === 'string' &&
      /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(entry.login) &&
      entry.type === 'User' &&
      typeof entry.id === 'number' &&
      Number.isSafeInteger(entry.id) && entry.id > 0 &&
      typeof entry.contributions === 'number' &&
      Number.isSafeInteger(entry.contributions) && entry.contributions > 0,
    )
    .map(entry => ({
      login: entry.login,
      avatarUrl: `https://avatars.githubusercontent.com/u/${entry.id}?v=4`,
      profileUrl: `https://github.com/${entry.login}`,
      commits: entry.contributions,
    }))
    .sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login))
}
