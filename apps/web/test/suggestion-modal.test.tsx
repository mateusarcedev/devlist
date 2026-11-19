import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddSuggestionModal from '../src/components/AddSuggestionModal'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  mutate: vi.fn(),
  reset: vi.fn(),
  success: null as null | ((value: { id: string; host: string }) => void),
  error: null as null | ((err: unknown) => void),
}))

let authUser: null | { id: string; name: string; githubLogin?: string; role: 'USER' | 'ADMIN' } = null

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: authUser, loading: false }),
}))

vi.mock('@/hooks/useSubmitSuggestion', () => ({
  useSubmitSuggestion: (callbacks: {
    onSuccess: (value: { id: string; host: string }) => void
    onError: (err: unknown) => void
  }) => {
    mocks.success = callbacks.onSuccess
    mocks.error = callbacks.onError
    return { mutate: mocks.mutate, reset: mocks.reset, isPending: false }
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

describe('AddSuggestionModal', () => {
  beforeEach(() => {
    authUser = null
    mocks.push.mockReset()
    mocks.mutate.mockReset()
    mocks.reset.mockReset()
  })

  it('shows one URL field and sign-in for anonymous visitors', () => {
    const onClose = vi.fn()
    render(<AddSuggestionModal isOpen onClose={onClose} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByLabelText('Tool link')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tool name')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with GitHub' }))
    expect(mocks.push).toHaveBeenCalledWith('/login')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('validates blank URL and clears errors on edit', () => {
    authUser = { id: 'u-1', name: 'Person', role: 'USER' }
    render(<AddSuggestionModal isOpen onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit suggestion' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Cole o link da ferramenta.')
    expect(mocks.mutate).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Tool link'), { target: { value: 'example.com' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('submits only the normalized URL', () => {
    authUser = { id: 'u-1', name: 'Person', githubLogin: 'mateusarcedev', role: 'USER' }
    render(<AddSuggestionModal isOpen onClose={vi.fn()} />)
    expect(screen.getByText('Submitting as @mateusarcedev')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tool link'), { target: { value: 'example.com/docs' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit suggestion' }))
    expect(mocks.mutate).toHaveBeenCalledWith({ url: 'https://example.com/docs' })
  })

  it('displays server duplicate errors and success with Suggest another', () => {
    authUser = { id: 'u-1', name: 'Person', role: 'USER' }
    render(<AddSuggestionModal isOpen onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Tool link'), { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit suggestion' }))
    act(() => mocks.error?.(new Error('Tool X já está no catálogo.')))
    expect(screen.getByRole('alert')).toHaveTextContent('Tool X já está no catálogo.')
    act(() => mocks.success?.({ id: 's1', host: 'example.com' }))
    expect(screen.getByRole('heading', { name: 'Suggestion submitted' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Suggest another' }))
    expect(screen.getByLabelText('Tool link')).toHaveValue('')
  })

  it('closes with Escape, Cancel and backdrop', () => {
    authUser = { id: 'u-1', name: 'Person', role: 'USER' }
    const onClose = vi.fn()
    const view = render(<AddSuggestionModal isOpen onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    view.rerender(<AddSuggestionModal isOpen={false} onClose={onClose} />)
    view.rerender(<AddSuggestionModal isOpen onClose={onClose} />)
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
