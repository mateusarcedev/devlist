import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DevhubAiSearch from '../src/components/DevhubAiSearch'

vi.mock('@/contexts/i18n-context', () => ({
  useI18n: () => ({ locale:'en', t: (key: string) => key }),
}))

afterEach(() => vi.unstubAllGlobals())

describe('DevhubAiSearch', () => {
  it('only submits when the user describes a need and renders real catalog URLs', async () => {
    const remote = vi.fn().mockResolvedValue({ok:true,json:async()=>({results:[{
      id:'tool-1',name:'Coolify',link:'https://coolify.io/',
      description:'Open-source self-hosted deployment platform.',
      categoryName:'DevOps & Infrastructure',accessModel:'OPEN_SOURCE',
    }]})})
    vi.stubGlobal('fetch',remote)
    render(<DevhubAiSearch />)

    const submit = screen.getByRole('button',{name:'Find tools'})
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByRole('button',{name:'Try an example'}))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    await waitFor(() => expect(remote).toHaveBeenCalledWith('/api/ai/search',
      expect.objectContaining({method:'POST'})))
    const link = await screen.findByRole('link',{name:/Visit/i})
    expect(link).toHaveAttribute('href','https://coolify.io/?ref=devlist.mateusarce.dev')
    expect(screen.getByText('Coolify')).toBeInTheDocument()
  })

  it('shows an honest empty state and does not invent tools', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({results:[]})}))
    render(<DevhubAiSearch />)
    fireEvent.change(screen.getByRole('textbox',{name:'What do you need?'}),
      {target:{value:'A very unusual programming tool for this niche use case'}})
    fireEvent.click(screen.getByRole('button',{name:'Find tools'}))
    expect(await screen.findByText(/No convincing matches were found/i)).toBeInTheDocument()
  })
})
