export default function LoadingCategoryTools() {
  return (
    <main className='dl-page'>
      <div className='mb-5 h-4 w-28 animate-pulse rounded bg-surface-hover' />
      <div className='mb-2 h-8 w-52 animate-pulse rounded bg-surface-hover' />
      <div className='mb-6 h-4 w-20 animate-pulse rounded bg-surface' />
      <div className='mb-6 h-[42px] w-full animate-pulse rounded-[7px] border border-border bg-surface' />
      <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className='h-[132px] animate-pulse rounded-[10px] border border-border bg-surface'
          />
        ))}
      </div>
    </main>
  )
}
