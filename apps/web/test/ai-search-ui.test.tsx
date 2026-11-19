import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DevhubAiSearch from '../src/components/DevhubAiSearch'

vi.mock('@/contexts/i18n-context', () => ({
  useI18n: () => ({ locale: 'en', t: (key: string) => key }),
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

afterEach(() => vi.unstubAllGlobals())

const tool = (index: number) => ({
  id: 'tool-' + index,
  name: index === 1 ? 'Coolify' : 'Tool ' + index,
  link: index === 1 ? 'https://coolify.io/' : 'https://example.com/tool-' + index,
  description: 'Open-source self-hosted deployment tool ' + index,
  categoryName: 'DevOps & Infrastructure',
  accessModel: 'OPEN_SOURCE' as const,
})

function openChat() {
  fireEvent.click(screen.getByRole('button', { name: 'Open DevHub AI chat' }))
}

describe('DevhubAiSearch floating chat', () => {
  it('stays collapsed until opened, accepts a prompt and shows catalog links', async () => {
    const remote = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [tool(1)] }),
    })
    vi.stubGlobal('fetch', remote)
    render(<DevhubAiSearch />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    openChat()
    expect(screen.getByRole('dialog', { name: 'DevHub AI' })).toBeInTheDocument()

    const submit = screen.getByRole('button', { name: 'Send message' })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    await waitFor(() => expect(remote).toHaveBeenCalledWith('/api/ai/search',
      expect.objectContaining({ method: 'POST' })))
    expect(await screen.findByText('Found 1 matching tools in the catalog.')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Visit tool: Coolify' })
    expect(link).toHaveAttribute('href', 'https://coolify.io/?ref=devlist.mateusarce.dev')
    expect(screen.getByText('Coolify')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close DevHub AI chat' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    openChat()
    expect(screen.getByText('Coolify')).toBeInTheDocument()
  })

  it('offers all 19 relevant results across progressive UI pages, not just six', async () => {
    const items = Array.from({ length: 19 }, (_, index) => tool(index + 1))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: items }) }))
    render(<DevhubAiSearch />)
    openChat()
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByText('Found 19 matching tools in the catalog.')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Visit tool:/ })).toHaveLength(8)
    fireEvent.click(screen.getByRole('button', { name: 'Show more tools (11 remaining)' }))
    expect(screen.getAllByRole('link', { name: /^Visit tool:/ })).toHaveLength(16)
    fireEvent.click(screen.getByRole('button', { name: 'Show more tools (3 remaining)' }))
    expect(screen.getAllByRole('link', { name: /^Visit tool:/ })).toHaveLength(19)
    expect(screen.queryByRole('button', { name: /Show more tools/ })).not.toBeInTheDocument()
  })

  it('keeps the search context for a short follow-up and starts a clean new chat', async () => {
    const remote = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) })
    vi.stubGlobal('fetch', remote)
    render(<DevhubAiSearch />)
    openChat()
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    await screen.findByText('No clear matches found. Try another description.')

    fireEvent.change(screen.getByRole('textbox', { name: 'Ask DevHub AI' }), {
      target: { value: 'without paying for hosting' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    await waitFor(() => expect(remote).toHaveBeenCalledTimes(2))
    expect(JSON.parse(remote.mock.calls[1][1].body).query).toContain('I need to deploy Docker apps')

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    expect(screen.queryByText('No clear matches found. Try another description.')).not.toBeInTheDocument()
    expect(screen.getByText(/Describe your development problem/i)).toBeInTheDocument()
  })

  it('shows the empty state without inventing tools', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }))
    render(<DevhubAiSearch />)
    openChat()
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask DevHub AI' }), {
      target: { value: 'A very unusual programming tool for this niche use case' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('No clear matches found. Try another description.')).toBeInTheDocument()
  })
})
