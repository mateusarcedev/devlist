import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { DELETE } from '../src/app/api/admin/catalog/[id]/route'

const mocks = vi.hoisted(() => ({
  adminClient: vi.fn(),
  from: vi.fn(),
  deleteTool: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock('@/lib/admin-suggestions', () => ({
  adminClient: mocks.adminClient,
  noStore: (body: unknown, status = 200) => NextResponse.json(body, { status }),
}))

const toolId = '93b5b4b9-93ab-4806-b6ad-0bbe97ffdfe4'
const request = {} as Parameters<typeof DELETE>[0]
const context = (id: string) => ({ params: Promise.resolve({ id }) })

describe('DELETE /api/admin/catalog/[id]', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(fn => fn.mockReset())
    mocks.adminClient.mockResolvedValue({ db: { from: mocks.from } })
    mocks.from.mockReturnValue({ delete: mocks.deleteTool })
    mocks.deleteTool.mockReturnValue({ eq: mocks.eq })
    mocks.eq.mockReturnValue({ select: mocks.select })
    mocks.select.mockReturnValue({ maybeSingle: mocks.maybeSingle })
    mocks.maybeSingle.mockResolvedValue({
      data: { id: toolId, name: 'Memos' },
      error: null,
    })
  })

  it('rejects visitors and non-admins without touching the table', async () => {
    mocks.adminClient.mockResolvedValue({
      error: NextResponse.json({ message: 'Acesso restrito' }, { status: 403 }),
    })
    const response = await DELETE(request, context(toolId))
    expect(response.status).toBe(403)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('rejects malformed identifiers', async () => {
    const response = await DELETE(request, context('not-a-uuid'))
    expect(response.status).toBe(422)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('deletes only the requested tool and returns its identity', async () => {
    const response = await DELETE(request, context(toolId))
    expect(response.status).toBe(200)
    expect(mocks.from).toHaveBeenCalledWith('tools')
    expect(mocks.eq).toHaveBeenCalledWith('id', toolId)
    expect(await response.json()).toEqual({ deleted: { id: toolId, name: 'Memos' } })
  })

  it('returns 404 when the tool does not exist', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    const response = await DELETE(request, context(toolId))
    expect(response.status).toBe(404)
  })

  it('reports a foreign-key conflict without reporting success', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: '23503' } })
    const response = await DELETE(request, context(toolId))
    expect(response.status).toBe(409)
  })

  it('reports database errors', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: 'XX000' } })
    const response = await DELETE(request, context(toolId))
    expect(response.status).toBe(500)
  })
})
