import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/seo/data',()=>({
  getSeoTools:vi.fn(async()=>[
    {id:'1',name:'Coolify',url:'https://coolify.io',description:'Deploy',
     category:{id:'a',name:'DevOps & Infrastructure'},createdAt:'2026-11-19T00:00:00.000Z'},
  ]),
  groupByCategory:(tools:{category:{name:string}}[])=>new Map([[tools[0].category.name,tools]]),
}))

import sitemap from '../src/app/sitemap'
import robots from '../src/app/robots'
import manifest from '../src/app/manifest'
import { noIndex } from '../src/lib/seo/metadata'

describe('SEO endpoints',()=>{
  it('exposes the real category URL in the sitemap',async()=>{
    const urls=(await sitemap()).map(row=>row.url)
    expect(urls).toContain('https://devhub.mateusarce.dev/')
    expect(urls).toContain('https://devhub.mateusarce.dev/contributors')
    expect(urls).toContain('https://devhub.mateusarce.dev/tools/DevOps%20%26%20Infrastructure')
    expect(urls).not.toContain('https://devhub.mateusarce.dev/favorites')
  })
  it('blocks private surfaces but allows llms.txt and AI crawlers',()=>{
    const data=robots()
    expect(data.sitemap).toContain('/sitemap.xml')
    expect(JSON.stringify(data.rules)).toContain('/api/')
    expect(JSON.stringify(data.rules)).toContain('OAI-SearchBot')
    expect(JSON.stringify(data.rules)).toContain('/llms-pt.txt')
  })
  it('uses a valid maskable PWA icon and does not index favorites',()=>{
    const data=manifest()
    expect(data.icons?.some(icon=>icon.src==='/icon-maskable-512.png')).toBe(true)
    expect(noIndex.robots).toMatchObject({index:false,follow:false})
  })
})
