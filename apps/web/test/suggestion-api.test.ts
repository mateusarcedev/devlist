import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/suggestions/route'

const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mock.getUser }, from: mock.from }),
}))

function request(body: unknown) {
  return { json: async () => body } as Parameters<typeof POST>[0]
}

describe('POST /api/suggestions', () => {
  beforeEach(() => {
    Object.values(mock).forEach(fn => fn.mockReset())
    mock.getUser.mockResolvedValue({ data: { user: { id: 'verified-id' } }, error: null })
    mock.from.mockReturnValue({ insert: mock.insert })
    mock.insert.mockReturnValue({ select: mock.select })
    mock.select.mockReturnValue({ single: mock.single })
    mock.single.mockResolvedValue({ data: { id: 's-1', host: 'example.com' }, error: null })
  })

  it('returns 422 for unsafe URLs', async () => {
    const response = await POST(request({ url: 'javascript://example.com' }))
    expect(response.status).toBe(422)
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('returns 401 for unauthenticated visitors', async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const response = await POST(request({ url: 'example.com' }))
    expect(response.status).toBe(401)
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('inserts only the authenticated ID and normalized link', async () => {
    const response = await POST(request({ url: 'www.example.com' }))
    expect(response.status).toBe(201)
    expect(mock.from).toHaveBeenCalledWith('suggestions')
    expect(mock.insert).toHaveBeenCalledWith({ user_id: 'verified-id', link: 'https://www.example.com/' })
    expect(mock.select).toHaveBeenCalledWith('id,host')
    expect(await response.json()).toEqual({ id: 's-1', host: 'example.com' })
  })

  it('returns 409 for catalog and pending duplicates', async () => {
    mock.single.mockResolvedValueOnce({ data: null, error: { code: 'D4091', message: 'Tool X já está no catálogo.' } })
    let response = await POST(request({ url: 'example.com' }))
    expect(response.status).toBe(409)
    expect((await response.json()).message).toContain('Tool X')

    mock.single.mockResolvedValueOnce({ data: null, error: { code: 'D4092', message: 'Pending' } })
    response = await POST(request({ url: 'example.com' }))
    expect(response.status).toBe(409)
    expect((await response.json()).message).toContain('já foi sugerido')
  })

  it('returns 429 when the database rate limit is reached', async () => {
    mock.single.mockResolvedValue({ data: null, error: { code: 'D4290', message: 'Limit reached' } })
    const response = await POST(request({ url: 'example.com' }))
    expect(response.status).toBe(429)
  })
})
