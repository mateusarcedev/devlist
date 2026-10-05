import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AxiosConfig from '@/utils'
import type { Tool } from '@/types'
import { useFavoriteToggle } from './useFavoriteToggle'

const postMock = vi.mocked(AxiosConfig.post)

let authState: {
  user: { githubId: number; name: string; avatar: string; role: 'USER' | 'ADMIN' } | null
  loading: boolean
} = {
  user: null,
  loading: false,
}

vi.mock('./useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/utils', () => ({
  AxiosConfig: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const tool: Tool = {
  id: 'tool-1',
  name: 'Vitest',
  link: 'https://vitest.dev',
  description: 'Testing framework',
  categoryId: 'testing',
}

describe('useFavoriteToggle', () => {
  beforeEach(() => {
    authState = { user: null, loading: false }
    postMock.mockReset()
  })

  it('does not call the API when a guest tries to favorite a tool', async () => {
    const { result } = renderHook(() => useFavoriteToggle(tool, false))

    await act(async () => {
      await result.current.toggle()
    })

    expect(postMock).not.toHaveBeenCalled()
    expect(result.current.isFavorite).toBe(false)
    expect(result.current.toast?.type).toBe('error')
    expect(result.current.toast?.message).toContain('log in')
  })

  it('optimistically removes an existing favorite and notifies the parent', async () => {
    authState = {
      user: {
        githubId: 42,
        name: 'Mateus',
        avatar: 'https://example.com/avatar.png',
        role: 'USER',
      },
      loading: false,
    }
    postMock.mockResolvedValue({} as never)
    const onFavoriteChange = vi.fn()

    const { result } = renderHook(() => useFavoriteToggle(tool, true))

    await act(async () => {
      await result.current.toggle(onFavoriteChange)
    })

    expect(postMock).toHaveBeenCalledWith('/favorites/toggle', {
      toolId: tool.id,
    })
    expect(result.current.isFavorite).toBe(false)
    expect(onFavoriteChange).toHaveBeenCalledWith(tool.id, false)
    expect(result.current.toast?.type).toBe('success')
  })

  it('rolls back the optimistic state when the API fails', async () => {
    authState = {
      user: {
        githubId: 42,
        name: 'Mateus',
        avatar: 'https://example.com/avatar.png',
        role: 'USER',
      },
      loading: false,
    }
    postMock.mockRejectedValue(new Error('network failure'))

    const { result } = renderHook(() => useFavoriteToggle(tool, true))

    await act(async () => {
      await result.current.toggle()
    })

    expect(result.current.isFavorite).toBe(true)
    expect(result.current.toast?.type).toBe('error')
  })
})
