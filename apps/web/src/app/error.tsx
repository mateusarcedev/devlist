'use client'

import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled frontend error', error)
  }, [error])

  return (
    <main className='dl-page'>
      <div className='px-4 py-24 text-center'>
        <AlertCircle className='mx-auto mb-4 h-7 w-7 text-subtle' />
        <h1 className='text-xl font-semibold text-white'>
          Something went wrong
        </h1>
        <p className='mx-auto mb-6 mt-2 max-w-[380px] text-sm leading-6 text-subtle'>
          We couldn&apos;t finish loading this page.
        </p>
        <button
          type='button'
          onClick={reset}
          className='rounded-[6px] bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
        >
          Try again
        </button>
      </div>
    </main>
  )
}
