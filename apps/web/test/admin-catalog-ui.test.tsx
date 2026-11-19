import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminCatalog from '../src/components/AdminCatalog'

vi.mock('@/contexts/i18n-context', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const tool = {
  id: '93b5b4b9-93ab-4806-b6ad-0bbe97ffdfe4',
  name: 'Memos',
  link: 'https://www.usememos.com/',
  access_model: 'UNVERIFIED',
  access_source_url: null,
  access_reviewed_at: null,
}

const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  json: async () => body,
})

afterEach(() => { vi.unstubAllGlobals() })

describe('AdminCatalog', () => {
  it('allows admins to choose and save a catalog access model', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({ tool: { ...tool, access_model: 'FREE' } })
      return jsonResponse({ tools: [tool] })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<AdminCatalog />)

    fireEvent.click(await screen.findByRole('button', { name: /Memos/i }))
    fireEvent.change(screen.getByLabelText('Modelo de acesso'), { target: { value: 'FREE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar classificação' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/catalog/' + tool.id,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ accessModel: 'FREE', sourceUrl: '' }),
      }),
    ))
  })

  it('requires typing the exact name before deletion and updates the list', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return jsonResponse({ deleted: { id: tool.id, name: tool.name } })
      return jsonResponse({ tools: [tool] })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<AdminCatalog />)

    fireEvent.click(await screen.findByRole('button', { name: /Memos/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir ferramenta' }))
    const confirmation = screen.getByLabelText(/Para confirmar, digite exatamente/i)
    const deleteButton = screen.getByRole('button', { name: 'Confirmar exclusão' })
    expect(deleteButton).toBeDisabled()
    fireEvent.change(confirmation, { target: { value: 'memo' } })
    expect(deleteButton).toBeDisabled()
    fireEvent.change(confirmation, { target: { value: 'Memos' } })
    expect(deleteButton).toBeEnabled()
    fireEvent.click(deleteButton)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/catalog/' + tool.id, { method: 'DELETE' },
    ))
    expect(await screen.findByRole('status')).toHaveTextContent('Memos: ferramenta excluída')
    expect(screen.getByText('Nenhuma ferramenta neste filtro.')).toBeInTheDocument()
  })

  it('does not call delete if an admin cancels the confirmation', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ tools: [tool] }))
    vi.stubGlobal('fetch', fetchMock)
    render(<AdminCatalog />)

    fireEvent.click(await screen.findByRole('button', { name: /Memos/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir ferramenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('button', { name: 'Confirmar exclusão' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
