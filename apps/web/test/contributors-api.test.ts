import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../src/app/api/contributors/route'

const mock = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('@/lib/public-contributors', () => ({
  fetchPublicContributors: mock.load,
}))

function request(sort?: string) {
  const url = new URL('https://devhub.mateusarce.dev/api/contributors')
  if (sort) url.searchParams.set('sort', sort)
  return { nextUrl: url } as Parameters<typeof GET>[0]
}

describe('GET /api/contributors', () => {
  beforeEach(() => mock.load.mockReset())

  it('returns real approved ranking data using the default sort', async () => {
    mock.load.mockResolvedValue([{ login: 'alpha', approvedCount: 2, recentTools: [] }])
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(mock.load).toHaveBeenCalledWith('approved')
    expect(await response.json()).toEqual({ contributors: [{ login: 'alpha', approvedCount: 2, recentTools: [] }] })
  })

  it('accepts recent sorting', async () => {
    mock.load.mockResolvedValue([])
    const response = await GET(request('recent'))
    expect(response.status).toBe(200)
    expect(mock.load).toHaveBeenCalledWith('recent')
  })

  it('rejects unexpected sort values', async () => {
    const response = await GET(request('followers'))
    expect(response.status).toBe(422)
    expect(mock.load).not.toHaveBeenCalled()
  })

  it('returns 503 instead of inventing contributor data when the read model is unavailable', async () => {
    mock.load.mockImplementation(() => { throw new Error('schema not migrated') })
    const response = await GET(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ message: 'Contributors temporarily unavailable.' })
  })
})
