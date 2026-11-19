import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchGitHubCodeContributors } from '../src/lib/github-code-contributors'

afterEach(() => vi.unstubAllGlobals())

describe('GitHub code contributor source', () => {
  it('normalizes and sorts verified GitHub users by authored commits', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 5, login: 'zeta', type: 'User', contributions: 4 },
        { id: 2, login: 'alpha', type: 'User', contributions: 12 },
        { id: 3, login: 'dependabot[bot]', type: 'Bot', contributions: 200 },
        { id: -1, login: 'invalid', type: 'User', contributions: 1 },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)
    const result = await fetchGitHubCodeContributors()
    expect(result).toEqual([
      { login: 'alpha', avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4', profileUrl: 'https://github.com/alpha', commits: 12 },
      { login: 'zeta', avatarUrl: 'https://avatars.githubusercontent.com/u/5?v=4', profileUrl: 'https://github.com/zeta', commits: 4 },
    ])
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/mateusarcedev/devlist/contributors?')
  })

  it('rejects pending GitHub statistics rather than showing fake contributors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 202 }))
    await expect(fetchGitHubCodeContributors()).rejects.toThrow('GitHub contributor statistics unavailable')
  })
})
