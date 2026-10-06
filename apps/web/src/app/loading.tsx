export default function Loading() {
  return (
    <main className='dl-page' aria-busy='true' aria-label='Loading content'>
      <div className='mb-5 h-8 w-48 animate-pulse rounded bg-surface-hover' />
      <div className='mb-8 h-4 w-80 max-w-full animate-pulse rounded bg-surface' />
      <div className='mb-4 h-[42px] w-full animate-pulse rounded-[6px] border border-border bg-surface' />
      <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className='h-[132px] animate-pulse rounded-[10px] border border-border bg-surface'
          />
        ))}
      </div>
      <span className='sr-only'>Loading…</span>
    </main>
  )
}
