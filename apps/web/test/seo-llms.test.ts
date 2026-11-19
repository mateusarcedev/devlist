import { beforeEach, describe, expect, it, vi } from 'vitest'

const sample = vi.hoisted(()=>[
  {id:'1',name:'Coolify',url:'https://coolify.io/',description:'Deploy containers',
    category:{id:'1',name:'DevOps & Infrastructure'}},
])
vi.mock('../src/lib/seo/data',()=>({
  getSeoTools: vi.fn(async()=>sample),
  groupByCategory: (tools: typeof sample, _locale: string) =>
    new Map([['DevOps & Infrastructure',tools]]),
}))

import { GET as english } from '../src/app/llms.txt/route'
import { GET as portuguese } from '../src/app/llms-pt.txt/route'

describe('llms.txt translations and source integrity', () => {
  beforeEach(()=>vi.clearAllMocks())
  it('includes real catalog links and matching EN navigation', async () => {
    const response = await english()
    const text = await response.text()
    expect(response.headers.get('Content-Type')).toContain('text/plain')
    expect(text).toContain('# DevHub')
    expect(text).toContain('Tools: 1 in 1 categories')
    expect(text).toContain('[Coolify](https://coolify.io/)')
    expect(text).toContain('llms-pt.txt')
  })
  it('offers a Portuguese document without claiming a localized HTML route', async () => {
    const response = await portuguese()
    const text = await response.text()
    expect(text).toContain('Ferramentas: 1 em 1 categorias')
    expect(text).toContain('## Páginas')
    expect(text).toContain('[Coolify](https://coolify.io/)')
    expect(text).toContain('llms.txt')
  })
})
