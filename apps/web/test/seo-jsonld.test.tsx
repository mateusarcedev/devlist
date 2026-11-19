import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { JsonLd } from '../src/components/seo/JsonLd'
import { categoryJsonLd, contributorsJsonLd, homeJsonLd } from '../src/lib/seo/jsonld'
import { groupByCategory, type SeoTool } from '../src/lib/seo/data'

const tools: SeoTool[] = [
  {id:'1',name:'Coolify',url:'https://coolify.io/',description:'Deploy on your own VPS',
    category:{id:'a',name:'DevOps & Infrastructure'}},
  {id:'2',name:'Canine',url:'https://canine.sh/',description:'Self-hosted PaaS',
    category:{id:'a',name:'DevOps & Infrastructure'}},
  {id:'3',name:'Memos',url:'https://www.usememos.com/',description:'Notes',
    category:{id:'b',name:'Documentation & Content'}},
]

describe('SEO structured data', () => {
  it('describes only real catalog tools and a functional ?q= search target', () => {
    const data = homeJsonLd(tools) as { '@graph': Record<string,unknown>[] }
    const website = data['@graph'].find(node=>node['@type']==='WebSite')!
    const search = website.potentialAction as {target:{urlTemplate:string}}
    expect(search.target.urlTemplate).toContain('/?q={search_term_string}')
    const catalog = data['@graph'].find(node=>node['@type']==='CollectionPage')!
    const list = catalog.mainEntity as {numberOfItems:number,itemListElement:{url:string}[]}
    expect(list.numberOfItems).toBe(3)
    expect(list.itemListElement.map(item=>item.url)).toEqual(tools.map(tool=>tool.url))
  })

  it('generates category URLs from the real /tools/[slug] route', () => {
    const data = categoryJsonLd('DevOps & Infrastructure',tools.slice(0,2))
    expect(data.url).toContain('/tools/DevOps%20%26%20Infrastructure')
    const list = data.mainEntity as {numberOfItems:number}
    expect(list.numberOfItems).toBe(2)
  })

  it('uses approved contributor profiles only', () => {
    const data = contributorsJsonLd([{login:'octocat',approvedCount:3}])
    expect(data.url).toContain('/contributors')
    const list = data.mainEntity as {itemListElement:{item:{url:string}}[]}
    expect(list.itemListElement[0].item.url).toBe('https://github.com/octocat')
  })

  it('escapes injected HTML from catalog descriptions inside JSON-LD', () => {
    const html = renderToStaticMarkup(<JsonLd data={{ description:'</script><script>alert(1)</script>' }}/>)
    expect(html).not.toContain('</script><script>')
    expect(html).toContain('\\u003c/script>')
  })

  it('groups catalog items by real categories', () => {
    const groups = groupByCategory(tools)
    expect(groups.size).toBe(2)
    expect(groups.get('DevOps & Infrastructure')?.map(item=>item.name)).toEqual(['Canine','Coolify'])
  })
})
