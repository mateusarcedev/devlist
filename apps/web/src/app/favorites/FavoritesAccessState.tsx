'use client'

import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FavoritesAccessStateKind = 'signed-out' | 'invalid-session' | 'load-error'

interface Props {
  state: FavoritesAccessStateKind
}

export default function FavoritesAccessState({ state }: Props) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const signOutAndRetry = async () => {
    if (signingOut) return

    setSigningOut(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_URL_API

      if (apiBaseUrl) {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        })
      }
    } catch {
      // The local session should still be abandoned even if logout is unavailable.
    } finally {
      router.replace('/login')
    }
  }

  if (state === 'signed-out') {
    return (
      <main className='dl-page'>
        <div className='px-4 py-24 text-center'>
          <h1 className='text-2xl font-semibold text-white'>
            Sign in to see your favorites
          </h1>
          <p className='mx-auto mb-6 mt-2 max-w-[380px] text-sm leading-6 text-subtle'>
            Favoriting tools requires a GitHub account so your saved collection
            follows you across devices.
          </p>
          <Link
            href='/login'
            className='inline-flex rounded-[6px] bg-white px-5 py-[11px] text-sm font-medium text-black transition-colors hover:bg-zinc-200'
          >
            Continue with GitHub
          </Link>
        </div>
      </main>
    )
  }

  if (state === 'invalid-session') {
    return (
      <main className='dl-page'>
        <div className='px-4 py-24 text-center'>
          <AlertCircle className='mx-auto mb-4 h-7 w-7 text-subtle' />
          <h1 className='text-xl font-semibold text-white'>
            We couldn&apos;t load your favorites
          </h1>
          <p className='mx-auto mb-6 mt-2 max-w-[380px] text-sm leading-6 text-subtle'>
            Your session looks invalid. Try signing out and back in again.
          </p>
          <button
            type='button'
            onClick={signOutAndRetry}
            disabled={signingOut}
            className='rounded-[6px] bg-white px-5 py-[11px] text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60'
          >
            {signingOut ? 'Signing out...' : 'Sign out and retry'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className='dl-page'>
      <div className='px-4 py-24 text-center'>
        <AlertCircle className='mx-auto mb-4 h-7 w-7 text-subtle' />
        <h1 className='text-xl font-semibold text-white'>
          We couldn&apos;t load your favorites
        </h1>
        <p className='mx-auto mb-6 mt-2 max-w-[380px] text-sm leading-6 text-subtle'>
          Something went wrong while fetching your saved tools.
        </p>
        <button
          type='button'
          onClick={() => router.refresh()}
          className='rounded-[6px] bg-white px-5 py-[11px] text-sm font-medium text-black transition-colors hover:bg-zinc-200'
        >
          Try again
        </button>
      </div>
    </main>
  )
}
