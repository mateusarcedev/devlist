'use client'

import { AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { FaGithub } from 'react-icons/fa'

export function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const hasAuthError = error === 'auth_failed'

  return (
    <main className='mx-auto w-full max-w-[380px] px-6 pb-16 pt-[clamp(48px,10vw,120px)] text-center'>
      <h1 className='text-[26px] font-semibold tracking-[-0.02em] text-white'>
        Sign in to Tools4.tech
      </h1>
      <p className='mx-auto mb-8 mt-2 max-w-[340px] text-sm leading-6 text-subtle'>
        Use your GitHub account to favorite tools and suggest new ones for the
        community.
      </p>

      {hasAuthError && (
        <div
          role='alert'
          className='mb-5 flex items-center gap-2 rounded-[6px] border border-border-strong bg-surface px-3 py-2.5 text-left text-[13px] text-danger'
        >
          <AlertCircle className='h-4 w-4 shrink-0' />
          Authentication failed. Please try again.
        </div>
      )}

      <a
        href={`${process.env.NEXT_PUBLIC_URL_API}/auth/github`}
        className='mb-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-[6px] bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-zinc-200'
      >
        <FaGithub className='h-[17px] w-[17px]' />
        Continue with GitHub
      </a>

      <p className='text-xs leading-[1.5] text-faint'>
        We only request your public GitHub profile — used to save favorites
        and attribute suggestions.
      </p>
    </main>
  )
}

function LoginFallback() {
  return (
    <main className='mx-auto w-full max-w-[380px] px-6 pb-16 pt-[clamp(48px,10vw,120px)] text-center'>
      <div className='mx-auto mb-3 h-8 w-64 animate-pulse rounded bg-surface-hover' />
      <div className='mx-auto mb-8 h-10 w-80 max-w-full animate-pulse rounded bg-surface' />
      <div className='h-11 w-full animate-pulse rounded-[6px] bg-surface-hover' />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
