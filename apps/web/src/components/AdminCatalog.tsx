'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, RefreshCcw, Search, Trash2 } from 'lucide-react'
import ToolAccessBadge from './ToolAccessBadge'
import { accessModels, type AccessModel } from '@/lib/tool-access'

interface CatalogTool {
  id: string
  name: string
  link: string
  access_model: AccessModel
  access_source_url: string | null
  access_reviewed_at: string | null
}

const labels: Record<AccessModel, string> = {
  UNVERIFIED: 'A verificar',
  OPEN_SOURCE: 'Open source',
  FREE: 'Grátis',
  FREEMIUM: 'Freemium',
  PAID: 'Pago (fora do catálogo)',
}
const inputClass = 'h-11 w-full rounded-[8px] border border-border-strong bg-canvas px-3 text-[13px] text-text outline-none focus:border-[var(--mint-edge)] focus:ring-4 focus:ring-[var(--mint-dim)]'

export default function AdminCatalog() {
  const [tools, setTools] = useState<CatalogTool[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<AccessModel | 'ALL'>('UNVERIFIED')
  const [query, setQuery] = useState('')
  const [model, setModel] = useState<AccessModel>('UNVERIFIED')
  const [sourceUrl, setSourceUrl] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/catalog', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Falha ao carregar catálogo.')
      setTools(body.tools as CatalogTool[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) void load() })
    return () => { active = false }
  }, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return tools.filter(tool =>
      (filter === 'ALL' || tool.access_model === filter) &&
      (!term || (tool.name + ' ' + tool.link).toLowerCase().includes(term)),
    )
  }, [tools, filter, query])

  const current = tools.find(tool => tool.id === selected) ?? null
  const counts = useMemo(() => Object.fromEntries(
    accessModels.map(value => [value, tools.filter(tool => tool.access_model === value).length]),
  ) as Record<AccessModel, number>, [tools])

  const selectTool = (tool: CatalogTool) => {
    setSelected(tool.id)
    setModel(tool.access_model)
    setSourceUrl(tool.access_source_url ?? '')
    setShowDelete(false)
    setDeleteConfirmation('')
    setError('')
    setMessage('')
  }

  const save = async () => {
    if (!current || busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/catalog/' + current.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessModel: model, sourceUrl }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Falha ao salvar.')
      const updated = body.tool as CatalogTool
      setTools(previous => previous.map(tool => tool.id === updated.id ? updated : tool))
      setMessage(updated.name + ': classificação salva.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
    } finally {
      setBusy(false)
    }
  }

  const removeTool = async () => {
    if (!current || busy || deleteConfirmation !== current.name) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/catalog/' + current.id, { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Falha ao excluir ferramenta.')
      setTools(previous => previous.filter(tool => tool.id !== current.id))
      setSelected(null)
      setShowDelete(false)
      setDeleteConfirmation('')
      setMessage(current.name + ': ferramenta excluída do catálogo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir ferramenta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className='mx-auto w-full max-w-[1600px] px-[clamp(16px,2.3vw,28px)] pb-20 pt-9'>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='font-sans text-[28px] font-semibold text-text'>Revisar catálogo</h1>
          <p className='mt-1 max-w-[720px] text-[13px] text-muted'>Confirme o acesso gratuito ou a licença aberta antes de classificar. Ferramentas exclusivamente pagas deixam de aparecer para visitantes.</p>
          <Link href='/admin/suggestions' className='mt-2 inline-block text-[12px] text-accent hover:underline'>Voltar às sugestões</Link>
        </div>
        <button type='button' onClick={() => void load()} className='inline-flex h-10 items-center gap-2 rounded-[6px] border border-border-strong px-3 text-[12px] text-muted hover:text-accent'>
          <RefreshCcw className='h-4 w-4' /> Atualizar
        </button>
      </div>

      <div className='mb-5 flex flex-wrap gap-2'>
        <button type='button' onClick={() => { setFilter('ALL');setSelected(null) }}
          className={'rounded-[6px] border px-3 py-2 text-[12px] ' + (filter === 'ALL' ? 'border-[var(--mint-edge)] text-accent' : 'border-border-strong text-muted')}>Todas {tools.length}</button>
        {accessModels.map(value => (
          <button key={value} type='button' onClick={() => { setFilter(value);setSelected(null) }}
            className={'rounded-[6px] border px-3 py-2 text-[12px] ' + (filter === value ? 'border-[var(--mint-edge)] bg-[var(--mint-dim)] text-accent' : 'border-border-strong text-muted hover:text-text')}>
            {labels[value]} {counts[value]}
          </button>
        ))}
      </div>

      {error && <p role='alert' className='mb-4 rounded-[8px] border border-[var(--pink)] p-3 text-[12px] text-[var(--pink)]'>{error}</p>}
      {message && <p role='status' className='mb-4 rounded-[8px] border border-[var(--mint-edge)] p-3 text-[12px] text-accent'>{message}</p>}

      <div className='grid gap-4 laptop:grid-cols-[minmax(280px,440px)_minmax(0,1fr)]'>
        <section aria-label='Ferramentas para revisão' className='min-w-0 overflow-hidden rounded-[10px] border border-border-strong bg-surface'>
          <div className='relative border-b border-border p-3'>
            <Search className='pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle'/>
            <input aria-label='Buscar ferramentas para revisar' type='search' value={query} onChange={e => setQuery(e.target.value)}
              placeholder='Buscar nome ou domínio' className={inputClass + ' pl-10'} />
          </div>
          <div className='max-h-[720px] overflow-y-auto'>
            {loading ? <p className='p-5 text-[13px] text-muted'>Carregando…</p> :
              filtered.length === 0 ? <p className='p-5 text-[13px] text-muted'>Nenhuma ferramenta neste filtro.</p> :
              filtered.map(tool => (
                <button key={tool.id} type='button' onClick={() => selectTool(tool)}
                  aria-pressed={selected === tool.id}
                  className={'flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left hover:bg-surface-hover ' +
                    (selected === tool.id ? 'bg-surface-hover' : '')}>
                  <span className='min-w-0'><span className='block truncate font-sans text-[13px] font-medium text-text'>{tool.name}</span>
                    <span className='block truncate text-[11px] text-subtle'>{tool.link}</span></span>
                  <ToolAccessBadge model={tool.access_model}/>
                </button>
              ))}
          </div>
        </section>

        <section aria-label='Classificação da ferramenta' className='min-w-0 self-start rounded-[10px] border border-border-strong bg-surface p-5'>
          {!current ? <p className='py-14 text-center text-[13px] text-muted'>Selecione uma ferramenta para classificar.</p> : <>
            <h2 className='font-sans text-[20px] font-semibold text-text'>{current.name}</h2>
            <a href={current.link} target='_blank' rel='noopener noreferrer' className='mt-1 inline-flex max-w-full items-center gap-1 break-all text-[12px] text-accent hover:underline'>
              {current.link} <ArrowUpRight className='h-3 w-3 shrink-0'/>
            </a>
            <div className='mt-5'>
              <label htmlFor='catalog-access' className='mb-1.5 block text-[12px] text-muted'>Modelo de acesso</label>
              <select id='catalog-access' value={model} onChange={e => setModel(e.target.value as AccessModel)} disabled={busy} className={inputClass}>
                {accessModels.map(value => <option key={value} value={value}>{labels[value]}</option>)}
              </select>
            </div>
            <div className='mt-4'>
              <label htmlFor='catalog-source' className='mb-1.5 block text-[12px] text-muted'>Página oficial da licença ou preços (recomendada)</label>
              <input id='catalog-source' type='url' value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
                placeholder='https://.../pricing' disabled={busy} className={inputClass}/>
            </div>
            <p className='mt-3 text-[12px] leading-relaxed text-muted'>Open source: código sob licença aberta. Grátis: uso gratuito. Freemium: plano gratuito funcional com recursos pagos opcionais. Pago: exige pagamento para uso real.</p>
            {model === 'PAID' && <p className='mt-3 text-[12px] text-[var(--pink)]'>Esta ferramenta será ocultada do catálogo público e dos favoritos.</p>}
            <button type='button' onClick={() => void save()} disabled={busy || !!sourceUrl && !/^https:\/\/[^\s]+$/i.test(sourceUrl)}
              className='mt-5 h-11 rounded-[6px] bg-accent px-5 text-[13px] font-semibold text-[var(--on-mint)] disabled:opacity-50'>
              {busy ? 'Salvando…' : 'Salvar classificação'}
            </button>

            <div className='mt-8 border-t border-border pt-5'>
              <h3 className='text-[14px] font-semibold text-text'>Excluir ferramenta</h3>
              <p className='mt-1 text-[12px] leading-relaxed text-muted'>
                Exclusão permanente. Os favoritos associados serão removidos e sugestões relacionadas perderão o vínculo com esta ferramenta.
              </p>
              {!showDelete ? (
                <button type='button' disabled={busy} onClick={() => { setShowDelete(true); setDeleteConfirmation(''); setError('') }}
                  className='mt-3 inline-flex h-10 items-center gap-2 rounded-[6px] border border-[var(--pink)] px-4 text-[12px] font-medium text-[var(--pink)] disabled:opacity-50'>
                  <Trash2 className='h-4 w-4' /> Excluir ferramenta
                </button>
              ) : (
                <div className='mt-4 space-y-3 rounded-[8px] border border-[var(--pink)] p-4'>
                  <label htmlFor='catalog-delete-confirm' className='block text-[12px] text-muted'>
                    Para confirmar, digite exatamente <strong className='text-text'>{current.name}</strong>:
                  </label>
                  <input id='catalog-delete-confirm' type='text' autoComplete='off' value={deleteConfirmation}
                    onChange={e => setDeleteConfirmation(e.target.value)} disabled={busy} className={inputClass}
                    placeholder='Nome exato da ferramenta' />
                  <div className='flex flex-wrap gap-2'>
                    <button type='button' onClick={() => void removeTool()} disabled={busy || deleteConfirmation !== current.name}
                      className='h-10 rounded-[6px] bg-[var(--pink)] px-4 text-[12px] font-semibold text-white disabled:opacity-40'>
                      {busy ? 'Excluindo…' : 'Confirmar exclusão'}
                    </button>
                    <button type='button' onClick={() => { setShowDelete(false); setDeleteConfirmation('') }} disabled={busy}
                      className='h-10 rounded-[6px] border border-border-strong px-4 text-[12px] text-muted disabled:opacity-50'>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>}
        </section>
      </div>
    </main>
  )
}
