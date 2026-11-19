import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../src/app/api/contributors/route'

const mock = vi.hoisted(() => ({ load: vi.fn(), github: vi.fn() }))
vi.mock('@/lib/public-contributors', () => ({
  fetchPublicContributors: mock.load,
  ContributorSchemaPendingError: class ContributorSchemaPendingError extends Error {},
}))
vi.mock('@/lib/github-code-contributors', () => ({
  fetchGitHubCodeContributors: mock.github,
}))

function request(sort?: string) {
  const url = new URL('https://devhub.mateusarce.dev/api/contributors')
  if (sort) url.searchParams.set('sort', sort)
  return { nextUrl: url } as Parameters<typeof GET>[0]
}

describe('GET /api/contributors', () => {
  beforeEach(() => {
    mock.load.mockReset()
    mock.github.mockReset()
    mock.load.mockResolvedValue([])
    mock.github.mockResolvedValue([])
  })

  it('returns both code contributors and approved tools without mixing metrics', async () => {
    mock.load.mockResolvedValue([{ login: 'alpha', approvedCount: 2, recentTools: [] }])
    mock.github.mockResolvedValue([{ login: 'alpha', commits: 8, avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', profileUrl: 'https://github.com/alpha' }])
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(mock.load).toHaveBeenCalledWith('approved')
    expect(mock.github).toHaveBeenCalledOnce()
    expect(await response.json()).toEqual({
      contributors: [{ login: 'alpha', approvedCount: 2, recentTools: [] }],
      codeContributors: [{ login: 'alpha', commits: 8, avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', profileUrl: 'https://github.com/alpha' }],
      sources: { catalog: 'ok', github: 'ok' },
    })
  })

  it('accepts recent sort for approved tool credits', async () => {
    const response = await GET(request('recent'))
    expect(response.status).toBe(200)
    expect(mock.load).toHaveBeenCalledWith('recent')
  })

  it('rejects unexpected sort values before contacting either source', async () => {
    const response = await GET(request('followers'))
    expect(response.status).toBe(422)
    expect(mock.load).not.toHaveBeenCalled()
    expect(mock.github).not.toHaveBeenCalled()
  })

  it('keeps GitHub contributors accessible when the catalog schema is missing', async () => {
    mock.load.mockRejectedValue(new Error('missing catalog table'))
    mock.github.mockResolvedValue([{ login: 'alpha', commits: 8 }])
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      contributors: [],
      codeContributors: [{ login: 'alpha', commits: 8 }],
      sources: { catalog: 'unavailable', github: 'ok' },
    })
  })

  it('identifies pending catalog migration separately from a GitHub failure', async () => {
    const { ContributorSchemaPendingError } = await import('../src/lib/public-contributors')
    mock.load.mockRejectedValue(new ContributorSchemaPendingError())
    mock.github.mockResolvedValue([{ login: 'alpha', commits: 8 }])
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect((await response.json()).sources).toEqual({ catalog: 'setup', github: 'ok' })
  })

  it('keeps tool contributors accessible if GitHub is temporarily unavailable', async () => {
    mock.load.mockResolvedValue([{ login: 'alpha', approvedCount: 2 }])
    mock.github.mockRejectedValue(new Error('GitHub rate limited'))
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect((await response.json()).sources).toEqual({ catalog: 'ok', github: 'unavailable' })
  })

  it('returns 503 only when both sources fail', async () => {
    mock.load.mockRejectedValue(new Error('catalog missing'))
    mock.github.mockRejectedValue(new Error('GitHub unavailable'))
    const response = await GET(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ message: 'Contributors temporarily unavailable.' })
  })
})
