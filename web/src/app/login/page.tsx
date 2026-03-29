'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_URL_API}/auth/github`
  }

  return (
    <div className='flex flex-col justify-center items-center h-screen gap-6'>
      <h1 className='text-2xl font-bold text-white'>Sign in to Tools4.tech</h1>

      {error === 'auth_failed' && (
        <p className='text-red-400 text-sm'>
          Authentication failed. Please try again.
        </p>
      )}

      <button
        onClick={handleLogin}
        className='flex items-center gap-2 px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors'
      >
        Continue with GitHub
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
