import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AxiosConfig from '@/utils/axiosConfig'
import { AuthProvider, useAuthContext, type AuthUser } from './auth-context'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

vi.mock('@/utils/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(AxiosConfig.get)
const postMock = vi.mocked(AxiosConfig.post)

function Probe() {
  const { user, loading, logout } = useAuthContext()

  return (
    <div>
      <span>{loading ? 'loading' : 'ready'}</span>
      <span>{user?.name ?? 'guest'}</span>
      <button onClick={() => void logout()}>logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    getMock.mockReset()
    postMock.mockReset()
  })

  it('loads the current authenticated user', async () => {
    const user: AuthUser = {
      githubId: 42,
      name: 'Mateus',
      avatar: 'https://example.com/avatar.png',
      role: 'ADMIN',
    }

    getMock.mockResolvedValue({ data: user } as never)

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading')).not.toBeNull()
    expect(await screen.findByText('Mateus')).not.toBeNull()
    expect(screen.getByText('ready')).not.toBeNull()
    expect(getMock).toHaveBeenCalledWith('/auth/me')
  })

  it('falls back to guest when /auth/me rejects', async () => {
    getMock.mockRejectedValue(new Error('unauthorized'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(await screen.findByText('guest')).not.toBeNull()
    expect(screen.getByText('ready')).not.toBeNull()
  })

  it('logs out through the API and returns to the home page', async () => {
    const user: AuthUser = {
      githubId: 42,
      name: 'Mateus',
      avatar: 'https://example.com/avatar.png',
      role: 'USER',
    }

    getMock.mockResolvedValue({ data: user } as never)
    postMock.mockResolvedValue({} as never)

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await screen.findByText('Mateus')
    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/logout')
      expect(replaceMock).toHaveBeenCalledWith('/')
    })
    expect(screen.getByText('guest')).not.toBeNull()
  })
})
