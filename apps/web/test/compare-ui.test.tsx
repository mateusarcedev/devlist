import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CompareContent from '../src/components/CompareContent'

vi.mock('@/contexts/i18n-context',()=>({
  useI18n:()=>({locale:'en',t:(key:string)=>key}),
}))

const coolify='50e1b7f8-c809-413d-a10c-846be7f8910d'
const canine='66de52f4-7fbb-4802-bf39-5a392fd40f0c'
const unknown='68c2ba1c-e340-49d0-94e2-5819dfc27167'
const tools=[
  {id:coolify,name:'Coolify',link:'https://coolify.io/',description:'Self-hosted deployment',
    categoryId:'cat',accessModel:'OPEN_SOURCE' as const},
  {id:canine,name:'Canine',link:'https://canine.sh/',description:'Kubernetes platform',
    categoryId:'cat',accessModel:'OPEN_SOURCE' as const},
  {id:unknown,name:'Other product',link:'https://example.com/',description:'Developer tools',
    categoryId:'cat',accessModel:'UNVERIFIED' as const},
]
const categories=[{id:'cat',name:'DevOps & Infrastructure'}]
const compared=tools.slice(0,2).map(item=>({
  id:item.id,name:item.name,link:item.link,description:item.description,
  categoryName:'DevOps & Infrastructure',accessModel:item.accessModel,
  accessSourceUrl:null,
  evidence:item.name==='Coolify'
    ? {useCases:['Self-hosted deployment'],limitations:['Manage your own server'],
       pricingNote:'No license fee for self-hosted use.',sourceUrl:'https://coolify.io/docs/core/selfhosted-cloud-comparison',
       reviewedAt:'2026-11-19',
       en:{useCases:['Self-hosted deployment'],limitations:['Manage your own server'],
         pricingNote:'No license fee for self-hosted use.'}}
    : {useCases:[],limitations:[],pricingNote:null,sourceUrl:null,reviewedAt:null},
}))

afterEach(()=>vi.unstubAllGlobals())

describe('CompareContent',()=>{
  it('selects two different catalog tools and renders only sourced claims',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
      tools:compared,semanticPairs:[{leftId:coolify,rightId:canine,similarity:0.83}],
    })}))
    render(<CompareContent tools={tools} categories={categories}/>)
    expect(screen.getByRole('button',{name:'Compare tools'})).toBeDisabled()
    const search=screen.getByRole('searchbox',{name:'Search catalog tools'})
    fireEvent.change(search,{target:{value:'Coolify'}})
    fireEvent.click(screen.getByRole('option',{name:/Coolify/}))
    fireEvent.change(search,{target:{value:'Canine'}})
    fireEvent.click(screen.getByRole('option',{name:/Canine/}))
    expect(screen.getByRole('button',{name:'Compare tools'})).toBeEnabled()
    fireEvent.click(screen.getByRole('button',{name:'Compare tools'}))
    await waitFor(()=>expect(screen.getAllByText('Self-hosted deployment').length).toBeGreaterThan(0))
    expect(screen.getByText('83%')).toBeInTheDocument()
    expect(screen.getByText('No license fee for self-hosted use.')).toBeInTheDocument()
    expect(screen.getByText('No exact price or billing limits verified for this tool.')).toBeInTheDocument()
    expect(screen.getAllByText('Not documented in the catalog.').length).toBeGreaterThan(0)
  })
  it('does not allow more than three tools or duplicates',()=>{
    render(<CompareContent tools={tools} categories={categories}/>)
    const search=screen.getByRole('searchbox',{name:'Search catalog tools'})
    for(const name of ['Coolify','Canine','Other product']){
      fireEvent.change(search,{target:{value:name}})
      fireEvent.click(screen.getByRole('option',{name:new RegExp(name)}))
    }
    expect(search).toBeDisabled()
    expect(screen.getByText('Selected for comparison · 3/3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Remove Canine'}))
    expect(search).toBeEnabled()
  })
  it('can start a sourced comparison from a vendor example',async()=>{
    const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({
      tools:compared,semanticPairs:null,
    })})
    vi.stubGlobal('fetch',fetchMock)
    render(<CompareContent tools={tools} categories={categories}/>)
    fireEvent.click(screen.getByRole('button',{name:'Try Coolify vs Canine'}))
    await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('AI similarity is temporarily unavailable; sourced comparison facts remain visible.')).toBeInTheDocument()
  })
})
