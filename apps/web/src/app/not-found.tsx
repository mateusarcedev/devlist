import Link from 'next/link'

export default function NotFound() {
  return (
    <main className='dl-page'>
      <div className='px-4 py-24 text-center'>
        <div className='mb-3 font-mono text-xs uppercase tracking-[0.08em] text-accent'>
          404
        </div>
        <h1 className='text-xl font-semibold text-white'>Page not found</h1>
        <p className='mx-auto mb-6 mt-2 max-w-[360px] text-sm leading-6 text-subtle'>
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href='/'
          className='inline-flex rounded-[6px] bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
        >
          Back to Discover
        </Link>
      </div>
    </main>
  )
}
