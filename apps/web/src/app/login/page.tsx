'use client'

import { createClient } from '@/lib/supabase/browser'
import { AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { FaGithub } from 'react-icons/fa'

export function LoginContent() {
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(params.get('error') === 'auth_failed')

  const signIn = async () => {
    setLoading(true)
    setError(false)
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      })
      if (error) throw error
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <main className='mx-auto w-full max-w-[380px] px-6 pb-16 pt-[clamp(48px,10vw,120px)] text-center'>
      <h1 className='text-[26px] font-semibold tracking-[-0.02em] text-white'>
        Sign in
      </h1>
      <p className='mx-auto mb-8 mt-2 max-w-[340px] text-sm leading-6 text-subtle'>
        Use GitHub to save favorites and suggest tools for the community.
      </p>
      {error && (
        <div role='alert' className='mb-5 flex items-center gap-2 rounded-[6px] border border-border-strong bg-surface px-3 py-2.5 text-left text-[13px] text-danger'>
          <AlertCircle className='h-4 w-4 shrink-0' />
          Authentication failed. Please try again.
        </div>
      )}
      <button type='button' onClick={() => void signIn()} disabled={loading}
        className='mb-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-[6px] bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-60'>
        <FaGithub className='h-[17px] w-[17px]' />
        {loading ? 'Redirecting…' : 'Continue with GitHub'}
      </button>
      <p className='text-xs leading-[1.5] text-faint'>
        Your GitHub profile is used for favorites and attribution.
      </p>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className='dl-page'>Loading sign in…</main>}>
      <LoginContent />
    </Suspense>
  )
}
