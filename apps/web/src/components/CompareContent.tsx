'use client'

/* eslint-disable @next/next/no-img-element -- Use the same favicon service as catalog cards. */

import { useI18n } from '@/contexts/i18n-context'
import ToolAccessBadge from '@/components/ToolAccessBadge'
import { getCategoryLabel } from '@/lib/category-labels'
import type { ComparedTool, SemanticPair } from '@/lib/comparison-facts'
import type { Category, Tool } from '@/types'
import { withReferral } from '@/lib/tool-url'
import { ArrowUpRight, Check, GitCompareArrows, LoaderCircle, Link2, Plus, Search, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

interface Props {
  tools: Tool[]
  categories: Category[]
  initialIds?: string[]
  loadError?: boolean
}
interface Payload { tools: ComparedTool[]; semanticPairs: SemanticPair[] | null }
const labels = {
  en: {
    title:'Intelligent tool comparison',intro:'Compare 2 or 3 real DevHub tools side by side. Facts are only shown when documented.',
    select:'Search catalog tools',placeholder:'Search by name or description…',
    add:'Add tool',remove:'Remove',selected:'Selected for comparison',compare:'Compare tools',
    comparing:'Comparing…',reset:'Clear comparison',share:'Copy comparison link',copied:'Link copied',
    failedCopy:'Could not copy the link.',unavailable:'The comparison is unavailable. Try again.',
    noMatches:'No matching tools in the public catalog.',
    empty:'Select two or three tools to see their differences.',
    differences:'Key differences, according to the catalog',purpose:'Purpose and differences',cases:'Documented use cases',
    limitations:'Known limitations',costs:'Known costs',source:'Official source',
    accessSource:'Access-model evidence',unknown:'Not documented in the catalog.',
    priceUnknown:'No exact price or billing limits verified for this tool.',
    costCaution:'Access type is not a final price. Hosting, usage and support may incur additional costs.',
    semantic:'AI semantic analysis',semanticNote:'Computed from catalog descriptions with an embedding model. It does not prove feature equivalence or indicate a winner.',
    aiUnavailable:'AI similarity is temporarily unavailable; sourced comparison facts remain visible.',
    asOf:'Reviewed',sourceWarning:'Vendor information may change. Check the linked official source before making a purchase.',
    website:'Official website',all:'Tool comparison',example:'Try Coolify vs Canine',
  },
  'pt-BR': {
    title:'Comparador inteligente',intro:'Compare 2 ou 3 ferramentas reais do DevHub lado a lado. Só exibimos informações documentadas.',
    select:'Buscar ferramentas no catálogo',placeholder:'Busque por nome ou descrição…',
    add:'Adicionar ferramenta',remove:'Remover',selected:'Selecionadas para comparação',compare:'Comparar ferramentas',
    comparing:'Comparando…',reset:'Limpar comparação',share:'Copiar link da comparação',copied:'Link copiado',
    failedCopy:'Não foi possível copiar o link.',unavailable:'Não foi possível comparar agora. Tente novamente.',
    noMatches:'Nenhuma ferramenta correspondente no catálogo público.',
    empty:'Selecione duas ou três ferramentas para comparar suas diferenças.',
    differences:'Principais diferenças segundo o catálogo',purpose:'Proposta e diferenças',cases:'Casos de uso documentados',
    limitations:'Limitações conhecidas',costs:'Custos conhecidos',source:'Fonte oficial',
    accessSource:'Fonte da classificação',unknown:'Não informado no catálogo.',
    priceUnknown:'Preço exato e limites de cobrança não verificados para esta ferramenta.',
    costCaution:'O modelo de acesso não determina o custo total. Hospedagem, uso e suporte podem gerar despesas.',
    semantic:'Análise semântica por IA',semanticNote:'Calculada a partir das descrições do catálogo por um modelo de embeddings. Não comprova equivalência de funcionalidades nem indica vencedores.',
    aiUnavailable:'A similaridade por IA está temporariamente indisponível; as informações verificadas continuam disponíveis.',
    asOf:'Revisado em',sourceWarning:'Informações de fornecedores podem mudar. Confira a fonte oficial antes de contratar.',
    website:'Site oficial',all:'Comparação de ferramentas',example:'Experimentar Coolify vs Canine',
  },
}

function domain(link:string):string{
  try{return new URL(link).hostname.replace(/^www\./,'')}
  catch{return link}
}

export default function CompareContent({tools,categories,initialIds=[],loadError=false}:Props) {
  const {locale}=useI18n()
  const t=labels[locale]
  const [selected,setSelected]=useState<string[]>(initialIds)
  const [query,setQuery]=useState('')
  const [active,setActive]=useState(false)
  const [result,setResult]=useState<Payload|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [feedback,setFeedback]=useState('')
  const request=useRef<AbortController|null>(null)
  const initialized=useRef(false)
  const nameById=useMemo(()=>new Map(tools.map(item=>[item.id,item])),[tools])
  const categoryById=useMemo(()=>new Map(categories.map(item=>[item.id,item.name])),[categories])

  const available=useMemo(()=>{
    const term=query.trim().toLocaleLowerCase(locale)
    return tools.filter(tool=>
      !selected.includes(tool.id) &&
      (!term||[tool.name,tool.description,categoryById.get(tool.categoryId)??''].some(value=>
        value.toLocaleLowerCase(locale).includes(term)))
    ).slice(0,12)
  },[tools,selected,query,categoryById,locale])

  useEffect(()=>()=>request.current?.abort(),[])

  const compare=async(ids:string[])=>{
    if(ids.length<2||ids.length>3)return
    request.current?.abort()
    const activeRequest=new AbortController()
    request.current=activeRequest
    setBusy(true);setError('');setResult(null);setFeedback('')
    try{
      const response=await fetch('/api/ai/compare',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ids}),signal:activeRequest.signal,
      })
      const body:Payload & {message?:string}=await response.json()
      if(!response.ok)throw new Error(body.message||t.unavailable)
      if(!Array.isArray(body.tools)||body.tools.length!==ids.length)throw new Error(t.unavailable)
      if(!activeRequest.signal.aborted){
        setResult({tools:body.tools,semanticPairs:Array.isArray(body.semanticPairs)?body.semanticPairs:null})
        if(window.location.protocol==='https:'||window.location.protocol==='http:')
          window.history.replaceState(window.history.state,'','/compare?tools='+encodeURIComponent(ids.join(',')))
      }
    }catch(e){
      if(!activeRequest.signal.aborted)setError(e instanceof Error?e.message:t.unavailable)
    }finally{if(!activeRequest.signal.aborted)setBusy(false)}
  }

  useEffect(()=>{
    if(initialized.current)return
    initialized.current=true
    if(initialIds.length>=2&&initialIds.every(id=>nameById.has(id)))void compare(initialIds)
    // Intentionally load a shared comparison once for the initial server-provided IDs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const add=(id:string)=>{
    if(selected.length>=3||selected.includes(id))return
    request.current?.abort();setBusy(false)
    setSelected(old=>[...old,id]);setQuery('');setActive(false);setResult(null);setFeedback('')
  }
  const remove=(id:string)=>{
    request.current?.abort();setBusy(false)
    setSelected(old=>old.filter(item=>item!==id));setResult(null);setFeedback('')
  }
  const reset=()=>{
    request.current?.abort();setBusy(false)
    setSelected([]);setResult(null);setError('');setFeedback('');setQuery('')
    if(window.location.protocol==='https:'||window.location.protocol==='http:')
      window.history.replaceState(window.history.state,'','/compare')
  }
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    if(selected.length>=2&&!busy)void compare(selected)
  }
  const share=async()=>{
    const ids=result?.tools.map(tool=>tool.id)??selected
    if(ids.length<2)return
    const url=new URL('/compare',window.location.origin)
    url.searchParams.set('tools',ids.join(','))
    try{await navigator.clipboard.writeText(url.toString());setFeedback(t.copied)}
    catch{setFeedback(t.failedCopy)}
  }
  const example=()=>{
    const coolify=tools.find(tool=>tool.name.toLowerCase()==='coolify')
    const canine=tools.find(tool=>tool.name.toLowerCase()==='canine')
    if(coolify&&canine){const ids=[coolify.id,canine.id];setSelected(ids);void compare(ids)}
  }
  const hasExample=tools.some(tool=>tool.name.toLowerCase()==='coolify') &&
    tools.some(tool=>tool.name.toLowerCase()==='canine')

  return (
    <main className='mx-auto w-full max-w-[1600px] px-[clamp(16px,2.3vw,28px)] pb-20 pt-7 tablet:pt-9'>
      <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='mb-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.13em] text-accent'>
            <GitCompareArrows aria-hidden='true' className='h-4 w-4'/> DevHub
          </div>
          <h1 className='font-sans text-[26px] font-semibold tracking-[-0.035em] text-text tablet:text-[32px]'>{t.title}</h1>
          <p className='mt-1.5 max-w-[740px] text-[13px] leading-relaxed text-muted'>{t.intro}</p>
        </div>
        {hasExample && selected.length===0 && !loadError && (
          <button type='button' onClick={example} className='rounded-[8px] border border-[var(--mint-edge)] px-4 py-2.5 text-[12px] text-accent hover:bg-[var(--mint-dim)]'>
            {t.example}
          </button>
        )}
      </div>

      {loadError ? (
        <p role='alert' className='rounded-[10px] border border-border-strong p-6 text-muted'>{t.unavailable}</p>
      ) : (
        <>
          <form onSubmit={submit} className='rounded-[12px] border border-border-strong bg-surface p-4 tablet:p-5'>
            <label htmlFor='compare-search' className='mb-2 block text-[12px] font-medium text-text'>{t.select}</label>
            <div className='relative'>
              <div className='flex h-11 items-center gap-2 rounded-[8px] border border-border-strong bg-canvas px-3 focus-within:border-[var(--mint-edge)]'>
                <Search aria-hidden='true' className='h-4 w-4 shrink-0 text-subtle'/>
                <input id='compare-search' type='search' value={query}
                  placeholder={t.placeholder}
                  disabled={selected.length>=3}
                  onChange={event=>{setQuery(event.target.value);setActive(true)}}
                  onFocus={()=>setActive(true)}
                  onKeyDown={event=>{
                    if(event.key==='Escape')setActive(false)
                    if(event.key==='Enter' && active && available.length>0){
                      event.preventDefault();add(available[0].id)
                    }
                  }}
                  className='h-full min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle disabled:opacity-50'
                  aria-autocomplete='list' aria-expanded={active&&selected.length<3}
                  aria-controls='compare-tool-options'
                />
              </div>
              {active&&selected.length<3&&(
                <div id='compare-tool-options' role='listbox' aria-label={t.select}
                  className='absolute left-0 right-0 top-[calc(100%+5px)] z-30 max-h-[250px] overflow-y-auto rounded-[10px] border border-border-strong bg-surface-raised p-1 shadow-xl'>
                  {available.length===0 ?
                    <p className='px-3 py-4 text-[12px] text-muted'>{t.noMatches}</p> :
                    available.map(tool=>(
                      <button key={tool.id} type='button' role='option' aria-selected={false}
                        onClick={()=>add(tool.id)}
                        className='flex w-full items-center justify-between gap-3 rounded-[7px] px-3 py-2.5 text-left text-[12px] text-text hover:bg-surface-hover'>
                        <span className='min-w-0'>
                          <span className='block truncate font-semibold'>{tool.name}</span>
                          <span className='block truncate text-[11px] text-subtle'>
                            {getCategoryLabel(categoryById.get(tool.categoryId)??'',locale)}
                          </span>
                        </span>
                        <Plus aria-label={t.add} className='h-4 w-4 shrink-0 text-accent'/>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            <p className='mt-4 text-[11px] font-medium uppercase tracking-[0.11em] text-subtle'>
              {t.selected} · {selected.length}/3
            </p>
            <div className='mt-2 flex min-h-11 flex-wrap items-center gap-2'>
              {selected.length===0&&<span className='text-[12px] text-subtle'>{t.empty}</span>}
              {selected.map(id=>{
                const tool=nameById.get(id)
                if(!tool)return null
                return <span key={id} className='inline-flex items-center gap-1.5 rounded-full border border-[var(--mint-edge)] bg-[var(--mint-dim)] py-1.5 pl-3 pr-1.5 text-[12px] text-text'>
                  {tool.name}
                  <button type='button' aria-label={t.remove+' '+tool.name} onClick={()=>remove(id)}
                    className='grid h-7 w-7 place-items-center rounded-full text-accent hover:bg-surface-hover'>
                    <X aria-hidden='true' className='h-3.5 w-3.5'/>
                  </button>
                </span>
              })}
            </div>
            <div className='mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4'>
              <button type='button' onClick={reset} className='text-[12px] text-muted hover:text-text'>
                {t.reset}
              </button>
              <div className='flex flex-wrap gap-2'>
                <button type='button' onClick={()=>void share()} disabled={selected.length<2}
                  className='inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-border-strong px-3 text-[12px] text-text disabled:opacity-40'>
                  <Link2 aria-hidden='true' className='h-4 w-4'/>{t.share}
                </button>
                <button type='submit' disabled={selected.length<2||busy}
                  className='inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-accent px-4 text-[12.5px] font-semibold text-[var(--on-mint)] disabled:opacity-40'>
                  {busy?<LoaderCircle aria-hidden='true' className='h-4 w-4 animate-spin'/>:
                    <GitCompareArrows aria-hidden='true' className='h-4 w-4'/>}
                  {busy?t.comparing:t.compare}
                </button>
              </div>
            </div>
            {feedback&&<p role='status' className='mt-2 text-[12px] text-accent'>{feedback}</p>}
          </form>

          {error&&<p role='alert' className='mt-4 rounded-[8px] border border-[var(--pink)] p-3 text-[12px] text-danger'>{error}</p>}
          {result&&(
            <section aria-label={t.all} className='mt-7'>
              <div className='mb-3 flex items-center gap-2'>
                <ShieldCheck aria-hidden='true' className='h-4 w-4 text-accent'/>
                <p className='text-[12px] text-muted'>{t.sourceWarning}</p>
              </div>
              <section className='mb-4 rounded-[12px] border border-border-strong bg-surface p-4 tablet:p-5'>
                <h2 className='mb-3 font-sans text-[15px] font-semibold text-text'>{t.differences}</h2>
                <div className={'grid gap-3 '+(result.tools.length===3?'tablet:grid-cols-2 desktop:grid-cols-3':'tablet:grid-cols-2')}>
                  {result.tools.map(tool=>(
                    <div key={tool.id} className='rounded-[8px] border border-border-strong bg-canvas p-3'>
                      <p className='mb-1 text-[12px] font-semibold text-accent'>{tool.name}</p>
                      <p className='text-[12px] leading-relaxed text-muted'>
                        {locale==='en' && tool.evidence.en?.useCases[0]
                          ? tool.evidence.en.useCases[0]
                          : tool.evidence.useCases[0] ?? tool.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <div className={'grid gap-3 '+(result.tools.length===3?'tablet:grid-cols-2 desktop:grid-cols-3':'tablet:grid-cols-2')}>
                {result.tools.map(tool=>{
                  const facts=locale==='en' && tool.evidence.en
                    ? { ...tool.evidence, ...tool.evidence.en }
                    : tool.evidence
                  return <article key={tool.id} className='flex min-w-0 flex-col rounded-[12px] border border-border-strong bg-surface p-4 tablet:p-5'>
                    <div className='mb-4 flex items-center gap-3'>
                      <span aria-hidden='true' className='grid h-11 w-11 shrink-0 place-items-center rounded-[9px] border border-border-strong bg-canvas'>
                        <img alt='' loading='lazy' className='h-6 w-6 object-contain'
                          src={'https://www.google.com/s2/favicons?sz=128&domain='+encodeURIComponent(domain(tool.link))}
                        />
                      </span>
                      <div className='min-w-0'>
                        <h2 className='truncate font-sans text-[17px] font-semibold text-text'>{tool.name}</h2>
                        <p className='truncate text-[11px] text-subtle'>{domain(tool.link)}</p>
                      </div>
                    </div>
                    <div className='mb-4 flex flex-wrap items-center gap-2'>
                      <ToolAccessBadge model={tool.accessModel}/>
                      <span className='rounded-full border border-border-strong px-2 py-1 text-[10.5px] text-muted'>
                        {getCategoryLabel(tool.categoryName,locale)||tool.categoryName}
                      </span>
                    </div>
                    <div className='space-y-4 text-[12px] leading-relaxed'>
                      <div>
                        <h3 className='mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle'>{t.purpose}</h3>
                        <p className='whitespace-normal break-words text-text'>{tool.description}</p>
                      </div>
                      <div>
                        <h3 className='mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle'>{t.cases}</h3>
                        {facts.useCases.length?(
                          <ul className='space-y-1.5'>
                            {facts.useCases.map(item=><li key={item} className='flex items-start gap-2 text-muted'>
                              <Check aria-hidden='true' className='mt-0.5 h-3.5 w-3.5 shrink-0 text-accent'/>{item}
                            </li>)}
                          </ul>
                        ):<p className='italic text-subtle'>{t.unknown}</p>}
                      </div>
                      <div>
                        <h3 className='mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle'>{t.limitations}</h3>
                        {facts.limitations.length?(
                          <ul className='list-disc space-y-1.5 pl-4 text-muted'>
                            {facts.limitations.map(item=><li key={item}>{item}</li>)}
                          </ul>
                        ):<p className='italic text-subtle'>{t.unknown}</p>}
                      </div>
                      <div>
                        <h3 className='mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle'>{t.costs}</h3>
                        <p className='text-muted'>{facts.pricingNote??t.priceUnknown}</p>
                        <p className='mt-1.5 text-[11px] text-subtle'>{t.costCaution}</p>
                      </div>
                    </div>
                    <div className='mt-auto space-y-2 border-t border-border pt-4 text-[11.5px]'>
                      {facts.sourceUrl&&<a href={facts.sourceUrl} target='_blank' rel='noopener noreferrer'
                        className='flex items-center gap-1.5 text-accent hover:underline'>
                        {t.source} <ArrowUpRight aria-hidden='true' className='h-3 w-3'/>
                      </a>}
                      {tool.accessSourceUrl&&<a href={tool.accessSourceUrl} target='_blank' rel='noopener noreferrer'
                        className='flex items-center gap-1.5 text-accent hover:underline'>
                        {t.accessSource} <ArrowUpRight aria-hidden='true' className='h-3 w-3'/>
                      </a>}
                      {facts.reviewedAt&&<p className='text-subtle'>{t.asOf}: {facts.reviewedAt}</p>}
                      <a href={withReferral(tool.link)} target='_blank' rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 text-text hover:text-accent'>
                        {t.website}<ArrowUpRight aria-hidden='true' className='h-3 w-3'/>
                      </a>
                    </div>
                  </article>
                })}
              </div>
              <div className='mt-5 rounded-[12px] border border-border-strong bg-surface p-4 tablet:p-5'>
                <h2 className='flex items-center gap-2 font-sans text-[16px] font-semibold text-text'>
                  <GitCompareArrows aria-hidden='true' className='h-4 w-4 text-accent'/>{t.semantic}
                </h2>
                {result.semanticPairs&&result.semanticPairs.length>0 ?(
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {result.semanticPairs.map(pair=>{
                      const a=result.tools.find(tool=>tool.id===pair.leftId)
                      const b=result.tools.find(tool=>tool.id===pair.rightId)
                      if(!a||!b)return null
                      return <div key={pair.leftId+pair.rightId} className='rounded-[8px] border border-border-strong bg-canvas px-3 py-2 text-[12px] text-text'>
                        {a.name} × {b.name}
                        <strong className='ml-2 font-semibold text-accent'>{Math.round(pair.similarity*100)}%</strong>
                      </div>
                    })}
                  </div>
                ):<p className='mt-3 text-[12px] text-muted'>{t.aiUnavailable}</p>}
                <p className='mt-3 text-[11.5px] leading-relaxed text-subtle'>{t.semanticNote}</p>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
