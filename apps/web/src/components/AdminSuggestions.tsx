'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, CheckCircle2, RefreshCcw } from 'lucide-react'

type Status = 'PENDING'|'APPROVED'|'REJECTED'
interface Category { id:string;name:string }
interface Suggestion {
  id:string;link:string;host:string;user_id:string;created_at:string;status:Status;
  name:string|null;description:string|null;category_id:string|null;tool_id:string|null;
  reviewed_at:string|null;submitter:string;duplicate?:{id:string,name:string}
}
type Form = { name:string;description:string;categoryId:string }
const tabs: {id:Status,label:string}[] = [
  {id:'PENDING',label:'Pendentes'},{id:'APPROVED',label:'Aprovadas'},{id:'REJECTED',label:'Rejeitadas'},
]
const inputClass = 'w-full rounded-[8px] border border-border-strong bg-canvas px-3 py-2.5 text-[13px] text-text outline-none focus:border-[var(--mint-edge)] focus:ring-4 focus:ring-[var(--mint-dim)] disabled:opacity-60'

export default function AdminSuggestions({ categories }: { categories:Category[] }) {
  const [tab,setTab] = useState<Status>('PENDING')
  const [items,setItems] = useState<Suggestion[]>([])
  const [selected,setSelected] = useState<string|null>(null)
  const [form,setForm] = useState<Form>({name:'',description:'',categoryId:''})
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [toast,setToast] = useState('')
  const [counts,setCounts] = useState<Record<Status,number>>({PENDING:0,APPROVED:0,REJECTED:0})
  const [metaLoading,setMetaLoading] = useState(false)

  const load = useCallback(async (status:Status) => {
    setLoading(true);setError('')
    try {
      const response = await fetch('/api/admin/suggestions?status='+status,{cache:'no-store'})
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'Erro ao carregar sugestões.')
      const suggestions = payload.suggestions as Suggestion[]
      setItems(suggestions)
      setSelected(current => suggestions.some(s=>s.id===current)?current:(suggestions[0]?.id ?? null))
    } catch(e) { setError(e instanceof Error?e.message:'Erro inesperado');setItems([]);setSelected(null) }
    finally { setLoading(false) }
  },[])
  useEffect(() => { void load(tab) },[tab,load])
  useEffect(() => {
    let active=true
    void Promise.all(tabs.map(async t=>{
      const response=await fetch('/api/admin/suggestions?status='+t.id,{cache:'no-store'})
      const payload=await response.json()
      return [t.id,response.ok ? (payload.suggestions as Suggestion[]).length:0] as const
    })).then(entries=>{if(active)setCounts(Object.fromEntries(entries) as Record<Status,number>)}).catch(()=>{})
    return ()=>{active=false}
  },[tab,items.length])
  const current=useMemo(()=>items.find(s=>s.id===selected)??null,[items,selected])
  useEffect(()=>{
    if(!current) return
    setForm({name:current.name??'',description:current.description??'',categoryId:current.category_id??''})
  },[current])
  useEffect(()=>{
    if(!current || current.status!=='PENDING' || (current.name && current.description)) return
    let active=true
    setMetaLoading(true)
    void fetch('/api/admin/suggestions/'+current.id+'/metadata',{cache:'no-store'})
      .then(async response=>response.ok?response.json():null)
      .then(meta=>{
        if(!active||!meta)return
        setForm(previous=>({
          ...previous,
          name:previous.name || meta.name || '',
          description:previous.description || meta.description || '',
        }))
      }).catch(()=>{}).finally(()=>{if(active)setMetaLoading(false)})
    return ()=>{active=false}
  },[current])

  const valid=!!form.name.trim() && form.name.trim().length<=120 &&
    !!form.description.trim() && form.description.trim().length<=140 && !!form.categoryId
  const catName=categories.find(c=>c.id===form.categoryId)?.name ?? 'Categoria'
  const change=(key:keyof Form,value:string)=>setForm(previous=>({...previous,[key]:value}))
  const act=async (action:'save'|'approve'|'reject')=>{
    if(!current||busy)return
    setBusy(true);setError('');setToast('')
    try {
      const endpoint='/api/admin/suggestions/'+current.id+(action==='save'?'':'/'+action)
      const response=await fetch(endpoint,{
        method:action==='save'?'PATCH':'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:form.name,description:form.description,categoryId:form.categoryId||null}),
      })
      const payload=await response.json()
      if(!response.ok) throw new Error(payload.message || 'Falha na revisão')
      setToast(action==='approve' ? form.name+' publicada no catálogo. Crédito registrado.' :
        action==='reject'?'Sugestão rejeitada.':'Rascunho salvo.')
      await load(tab)
    }catch(e){setError(e instanceof Error?e.message:'Falha na revisão')}
    finally{setBusy(false)}
  }

  return <main className='mx-auto w-full max-w-[1240px] px-[clamp(16px,2.3vw,28px)] pb-20 pt-9'>
    <header className='mb-7 flex flex-wrap items-end justify-between gap-4'>
      <div>
        <h1 className='font-sans text-[28px] font-semibold tracking-[-0.025em] text-text'>Sugestões</h1>
        <p className='mt-1 text-[13px] text-muted'>Usuários enviam só o link. Complete os dados e publique no catálogo.</p>
      </div>
      <button type='button' onClick={()=>void load(tab)} aria-label='Atualizar sugestões'
        className='flex h-10 items-center gap-2 rounded-[6px] border border-border-strong px-3 text-[12px] text-muted hover:text-accent'>
        <RefreshCcw className='h-4 w-4'/> Atualizar
      </button>
    </header>
    <div role='tablist' aria-label='Status das sugestões' className='mb-5 flex flex-wrap gap-2'>
      {tabs.map(t=><button key={t.id} role='tab' aria-selected={tab===t.id} type='button'
        onClick={()=>{setTab(t.id);setSelected(null);setToast('')}}
        className={'rounded-[6px] border px-3 py-2 text-[12px] transition-colors '+
          (tab===t.id?'border-[var(--mint-edge)] bg-[var(--mint-dim)] text-accent':'border-border-strong text-muted hover:text-text')}>
        {t.label} <span className='ml-1 opacity-70'>{counts[t.id]}</span>
      </button>)}
    </div>
    {toast&&<div role='status' className='mb-4 flex items-center gap-2 rounded-[8px] border border-[var(--mint-edge)] bg-[var(--mint-dim)] px-4 py-3 text-[12px] text-accent'><CheckCircle2 className='h-4 w-4'/>{toast}</div>}
    {error&&<div role='alert' className='mb-4 rounded-[8px] border border-[var(--pink)] bg-[var(--pink-dim)] px-4 py-3 text-[12px] text-[var(--pink)]'>{error}</div>}
    <div className='grid min-h-[440px] gap-4 lg:grid-cols-[minmax(270px,420px)_minmax(0,1fr)]'>
      <section aria-label='Fila de sugestões' className='overflow-hidden rounded-[10px] border border-border-strong bg-surface'>
        {loading?<p className='p-5 text-[13px] text-muted'>Carregando sugestões…</p>:
          items.length===0?<p className='p-8 text-center text-[13px] text-muted'>Nada por aqui.</p>:
          <div className='max-h-[700px] overflow-y-auto'>
            {items.map(item=><button key={item.id} type='button' onClick={()=>setSelected(item.id)}
              aria-pressed={selected===item.id}
              className={'flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left transition-colors hover:bg-surface-hover '+
                (selected===item.id?'border-l-2 border-l-accent bg-surface-hover':'border-l-2 border-l-transparent')}>
              <span className='grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-surface-hover font-sans font-semibold text-text'>{item.host.charAt(0).toUpperCase()}</span>
              <span className='min-w-0 flex-1'>
                <span className='flex items-center gap-2'>
                  <span className='truncate text-[13px] font-medium text-text'>{item.host}</span>
                  {item.duplicate&&<span className='shrink-0 rounded-full bg-[var(--pink-dim)] px-2 py-0.5 text-[10px] text-[var(--pink)]'>duplicada</span>}
                </span>
                <span className='block truncate text-[11px] text-subtle'>{item.submitter} · {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
              </span>
            </button>)}
          </div>}
      </section>
      <section aria-label='Revisão da sugestão' className='rounded-[10px] border border-border-strong bg-surface p-5'>
        {!current?<p className='py-16 text-center text-[13px] text-muted'>Selecione uma sugestão para revisar.</p>:<>
          <div className='flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4'>
            <div className='min-w-0'>
              <p className='text-[12px] text-muted'>Link enviado por {current.submitter} · {new Date(current.created_at).toLocaleString('pt-BR')}</p>
              <a href={current.link} target='_blank' rel='noopener noreferrer' className='mt-1 inline-flex max-w-full items-center gap-1 break-all text-[12px] text-accent hover:underline'>
                {current.link}<ArrowUpRight className='h-3 w-3 shrink-0'/>
              </a>
            </div>
            <span className='rounded-full border border-border-strong px-2 py-1 text-[11px] text-muted'>
              {current.status==='PENDING'?'Aguardando revisão':current.status==='APPROVED'?'Publicada':'Rejeitada'}
            </span>
          </div>
          {current.duplicate&&<p role='alert' className='my-4 flex gap-2 rounded-[8px] bg-[var(--pink-dim)] p-3 text-[12px] text-[var(--pink)]'>
            <AlertTriangle className='h-4 w-4 shrink-0'/> Possível duplicata: {current.duplicate.name} já está no catálogo.
          </p>}
          {metaLoading&&<p className='mt-3 text-[11px] text-muted'>Consultando metadados do site…</p>}
          <div className='mt-5 grid gap-4 sm:grid-cols-2'>
            <div><label htmlFor='review-name' className='mb-1.5 block text-[12px] text-muted'>Nome</label>
              <input id='review-name' value={form.name} disabled={current.status!=='PENDING'||busy}
                onChange={e=>change('name',e.target.value)} maxLength={120} className={inputClass}/></div>
            <div><label htmlFor='review-category' className='mb-1.5 block text-[12px] text-muted'>Categoria</label>
              <select id='review-category' value={form.categoryId} disabled={current.status!=='PENDING'||busy}
                onChange={e=>change('categoryId',e.target.value)}
                className={inputClass+(!form.categoryId?' border-[var(--mint-edge)]':'')}>
                <option value=''>Escolha uma categoria…</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
          </div>
          <div className='mt-4'>
            <div className='mb-1.5 flex justify-between text-[12px] text-muted'><label htmlFor='review-description'>Descrição</label>
              <span className={form.description.length>140?'text-[var(--pink)]':''}>{form.description.length}/140</span></div>
            <textarea id='review-description' value={form.description} rows={3}
              disabled={current.status!=='PENDING'||busy}
              onChange={e=>change('description',e.target.value)} className={inputClass+' resize-y'}/>
          </div>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <div><p className='text-[11px] text-subtle'>DOMÍNIO</p><p className='text-[12px] text-text'>{current.host}</p></div>
            <div><p className='text-[11px] text-subtle'>CRÉDITO</p><p className='text-[12px] text-text'>{current.submitter}</p></div>
          </div>
          <div className='mt-5 rounded-[10px] border border-border-strong bg-canvas p-4'>
            <p className='mb-3 text-[10px] uppercase tracking-[0.12em] text-subtle'>Prévia do card</p>
            <div className='flex items-center gap-3'><span className='grid h-9 w-9 place-items-center rounded-[8px] bg-surface-hover font-semibold text-accent'>{(form.name||current.host).charAt(0).toUpperCase()}</span>
              <div className='min-w-0'><p className='truncate font-sans text-[15px] font-semibold text-text'>{form.name||current.host}</p><p className='text-[11px] text-muted'>{current.host}</p></div></div>
            <p className='mt-3 text-[12px] text-muted'>{form.description||'Descrição da ferramenta…'}</p>
            <span className='mt-3 inline-flex rounded-full border border-border-strong px-2 py-0.5 text-[11px] text-muted'>{catName}</span>
          </div>
          {current.status==='PENDING'&&<div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5'>
            <p className='text-[11px] text-muted'>{current.duplicate?'Recomendado: rejeitar como duplicada.':valid?'Pronto para publicar.':'Preencha nome, categoria e descrição (até 140 caracteres).'}</p>
            <div className='flex flex-wrap gap-2'>
              <button type='button' disabled={busy} onClick={()=>void act('reject')}
                className='h-10 rounded-[6px] border border-border-strong px-3 text-[12px] text-muted hover:border-[var(--pink)] hover:text-[var(--pink)] disabled:opacity-40'>
                {current.duplicate?'Rejeitar como duplicada':'Rejeitar'}</button>
              <button type='button' disabled={busy||!form.name.trim()||!form.description.trim()||form.description.length>140}
                onClick={()=>void act('save')}
                className='h-10 rounded-[6px] border border-border-strong px-3 text-[12px] text-muted hover:text-accent disabled:opacity-40'>Salvar</button>
              <button type='button' disabled={busy||!valid||!!current.duplicate}
                onClick={()=>void act('approve')}
                className='h-10 rounded-[6px] bg-accent px-3.5 text-[12px] font-semibold text-[var(--on-mint)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'>Aprovar e publicar</button>
            </div>
          </div>}
        </>}
      </section>
    </div>
  </main>
}
