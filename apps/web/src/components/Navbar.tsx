'use client'

/* eslint-disable @next/next/no-img-element -- GitHub OAuth avatars use remote user URLs and intentionally remain unoptimized. */

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import {
  Heart,
  LogOut,
  Menu,
  Plus,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import AddSuggestionModal from './AddSuggestionModal'
import { Toast } from './Toast'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'warning'
}

interface SubmitResult {
  status: 'success' | 'error'
  message?: string
}

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [toast, setToast] = useState<ToastState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isLogin = pathname === '/login'

  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ message, type })
  }

  const handleFavoritesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    if (!user) {
      showToast('Log in to access your favorites!', 'warning')
      return
    }

    router.push('/favorites')
  }

  const handleSuggestionClick = () => {
    setMobileMenuOpen(false)
    setIsModalOpen(true)
  }

  const handleModalSubmit = (result: SubmitResult) => {
    if (result.status === 'success') {
      showToast('Suggestion sent successfully!', 'success')
      return
    }

    showToast(
      result.message ?? 'Error sending suggestion. Please try again.',
      'error',
    )
  }

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    await logout()
  }

  if (isLogin) {
    return (
      <header className='border-b border-transparent px-[clamp(16px,4vw,32px)] py-6'>
        <Link
          href='/'
          className='font-mono text-[18px] font-semibold tracking-[-0.02em] text-white'
        >
          Tools4.tech
        </Link>
      </header>
    )
  }

  return (
    <>
      <nav className='sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur-sm'>
        <div className='mx-auto flex h-16 max-w-[1120px] items-center justify-between px-[clamp(16px,4vw,24px)]'>
          <div className='flex items-center gap-8'>
            <Link
              href='/'
              className='font-mono text-[17px] font-semibold tracking-[-0.02em] text-white'
            >
              Tools4.tech
            </Link>

            <div className='hidden items-center gap-1 tablet:flex'>
              <Link
                href='/'
                className='rounded-[6px] px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover'
              >
                Discover
              </Link>
              <button
                onClick={handleFavoritesClick}
                className='rounded-[6px] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-text'
              >
                Favorites
              </button>
              <Link
                href='/contributors'
                className='rounded-[6px] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-text'
              >
                Contributors
              </Link>
            </div>
          </div>

          <div className='hidden items-center gap-2 tablet:flex'>
            <Link
              href='https://github.com/mateusarcedev/devlist'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='GitHub repository'
              className='flex h-9 w-9 items-center justify-center rounded-[6px] text-muted transition-colors hover:bg-surface-hover hover:text-text'
            >
              <FaGithub className='h-[18px] w-[18px]' />
            </Link>

            <Button size='sm' onClick={handleSuggestionClick}>
              <Plus className='h-4 w-4' />
              Suggest a tool
            </Button>

            {!loading && user ? (
              <div className='relative ml-1'>
                <button
                  type='button'
                  onClick={() => setUserMenuOpen(open => !open)}
                  aria-label='Account menu'
                  aria-expanded={userMenuOpen}
                  className='flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface text-xs font-semibold text-text transition-colors hover:border-zinc-600'
                >
                  <img
                    src={user.avatar}
                    alt=''
                    className='h-full w-full object-cover'
                  />
                </button>

                {userMenuOpen && (
                  <div className='dl-enter absolute right-0 top-[calc(100%+8px)] w-[220px] rounded-[8px] border border-border-strong bg-surface p-1.5 shadow-[0_8px_24px_rgba(0,0,0,.5)]'>
                    <div className='mb-1.5 border-b border-border px-2.5 py-2'>
                      <div className='truncate text-[13px] font-medium text-white'>
                        {user.name}
                      </div>
                      <div className='mt-0.5 font-mono text-[11px] text-subtle'>
                        {user.role === 'ADMIN' ? 'Administrator' : 'Member'}
                      </div>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        href='/admin/addtools'
                        onClick={() => setUserMenuOpen(false)}
                        className='block rounded-[6px] px-2.5 py-2 text-[13px] text-text transition-colors hover:bg-border'
                      >
                        Add a tool (admin)
                      </Link>
                    )}

                    <button
                      type='button'
                      onClick={handleLogout}
                      className='flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-text transition-colors hover:bg-border'
                    >
                      <LogOut className='h-3.5 w-3.5' />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <a
                href={`${process.env.NEXT_PUBLIC_URL_API}/auth/github`}
                aria-label='Log in with GitHub'
                className='inline-flex h-8 items-center gap-2 rounded-[6px] bg-white px-3 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200'
              >
                <UserRound className='h-3.5 w-3.5' />
                Sign in
              </a>
            ) : (
              <div className='h-[34px] w-[34px] animate-pulse rounded-full border border-border bg-surface' />
            )}
          </div>

          <button
            type='button'
            onClick={() => setMobileMenuOpen(open => !open)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className='flex h-9 w-9 items-center justify-center rounded-[6px] text-muted transition-colors hover:bg-surface-hover hover:text-text tablet:hidden'
          >
            {mobileMenuOpen ? (
              <X className='h-5 w-5' />
            ) : (
              <Menu className='h-5 w-5' />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className='dl-enter border-t border-border px-[clamp(16px,4vw,24px)] py-4 tablet:hidden'>
            <div className='mx-auto flex max-w-[1120px] flex-col gap-1'>
              <Link
                href='/'
                onClick={() => setMobileMenuOpen(false)}
                className='rounded-[6px] px-2 py-3 text-[15px] font-medium text-text hover:bg-surface-hover'
              >
                Discover
              </Link>

              <button
                type='button'
                onClick={handleFavoritesClick}
                className='flex items-center gap-2 rounded-[6px] px-2 py-3 text-left text-[15px] font-medium text-text hover:bg-surface-hover'
              >
                <Heart className='h-4 w-4 text-subtle' />
                Favorites
              </button>

              <Link
                href='/contributors'
                onClick={() => setMobileMenuOpen(false)}
                className='flex items-center gap-2 rounded-[6px] px-2 py-3 text-[15px] font-medium text-text hover:bg-surface-hover'
              >
                <Users className='h-4 w-4 text-subtle' />
                Contributors
              </Link>

              <Link
                href='https://github.com/mateusarcedev/devlist'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 rounded-[6px] px-2 py-3 text-[15px] font-medium text-text hover:bg-surface-hover'
              >
                <FaGithub className='h-4 w-4 text-subtle' />
                GitHub
              </Link>

              <button
                type='button'
                onClick={handleSuggestionClick}
                className='flex items-center gap-2 rounded-[6px] px-2 py-3 text-left text-[15px] font-medium text-text hover:bg-surface-hover'
              >
                <Plus className='h-4 w-4 text-subtle' />
                Suggest a tool
              </button>

              {user?.role === 'ADMIN' && (
                <Link
                  href='/admin/addtools'
                  onClick={() => setMobileMenuOpen(false)}
                  className='rounded-[6px] px-2 py-3 text-[15px] font-medium text-text hover:bg-surface-hover'
                >
                  Add a tool (admin)
                </Link>
              )}

              <div className='my-2 h-px bg-border' />

              {!loading && user ? (
                <button
                  type='button'
                  onClick={handleLogout}
                  className='flex items-center gap-2 rounded-[6px] px-2 py-3 text-left text-[15px] font-medium text-muted hover:bg-surface-hover hover:text-text'
                >
                  <LogOut className='h-4 w-4' />
                  Sign out ({user.name})
                </button>
              ) : !loading ? (
                <a
                  href={`${process.env.NEXT_PUBLIC_URL_API}/auth/github`}
                  className='rounded-[6px] px-2 py-3 text-[15px] font-semibold text-white hover:bg-surface-hover'
                >
                  Sign in with GitHub
                </a>
              ) : null}
            </div>
          </div>
        )}
      </nav>

      <AddSuggestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
