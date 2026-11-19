'use client'

/* eslint-disable @next/next/no-img-element -- GitHub OAuth avatars use remote user URLs. */

import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/contexts/i18n-context'
import { useTheme } from '@/contexts/theme-context'
import { OPEN_SUGGESTION_EVENT } from '@/lib/suggestion-trigger'
import {
  LogOut, Menu, Moon, Plus, Sun, UserRound, X,
} from 'lucide-react'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AddSuggestionModal from './AddSuggestionModal'
import FavoriteNavCount from './FavoriteNavCount'
import { Toast } from './Toast'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'warning'
}

const repoUrl = 'https://github.com/mateusarcedev/devlist'

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const { locale, setLocale, t } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [toast, setToast] = useState<ToastState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isLogin = pathname === '/login'
  const isDiscover = pathname === '/' || pathname.startsWith('/tools/')
  const isFavorites = pathname === '/favorites'
  const isContributors = pathname === '/contributors'

  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMobileMenuOpen(false)
      setUserMenuOpen(false)
    }
    const openSuggestion = () => {
      setMobileMenuOpen(false)
      setIsModalOpen(true)
    }
    window.addEventListener('keydown', closeMenus)
    window.addEventListener(OPEN_SUGGESTION_EVENT, openSuggestion)
    return () => {
      window.removeEventListener('keydown', closeMenus)
      window.removeEventListener(OPEN_SUGGESTION_EVENT, openSuggestion)
    }
  }, [])

  const handleFavoritesClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    if (!user) {
      setToast({ message: t('loginFavorites'), type: 'warning' })
      return
    }
    router.push('/favorites')
  }

  const handleSuggestionClick = () => {
    setMobileMenuOpen(false)
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    await logout()
  }

  const toggleLocale = () => setLocale(locale === 'en' ? 'pt-BR' : 'en')
  const navClass = (active: boolean) =>
    'inline-flex items-center gap-2 rounded-[6px] px-3 py-[7px] text-[13px] transition-colors ' +
    (active ? 'bg-surface-hover text-text' : 'text-muted hover:bg-surface-hover hover:text-text')
  const ghostClass = 'grid h-11 min-w-11 place-items-center rounded-[6px] text-muted transition-colors hover:bg-[var(--mint-dim)] hover:text-accent'
  const favoriteCount = user?.id ? <FavoriteNavCount userId={user.id} /> : null

  if (isLogin) {
    return (
      <header className='border-b border-border px-[clamp(16px,2.3vw,28px)] py-6'>
        <Link href='/' className='font-sans text-[18px] font-semibold text-text'>DevHub</Link>
      </header>
    )
  }

  return (
    <>
      <header className='relative z-40 border-b border-border bg-canvas'>
        <div className='mx-auto flex min-h-[72px] max-w-[1240px] items-center justify-between gap-3 px-[clamp(16px,2.3vw,28px)] py-3.5'>
          <div className='flex min-w-0 items-center gap-7'>
            <Link
              href='/'
              className='inline-flex shrink-0 items-center gap-2.5 text-[14px] text-text'
            >
              <span aria-hidden='true' className='h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--mint)]' />
              <span className='font-sans font-semibold tracking-[-0.01em]'>devhub</span>
              <span aria-hidden='true' className='text-subtle'>/</span>
              <span className='text-[12px] text-muted'>{pathname.startsWith('/admin') ? 'admin' : t('catalogCrumb')}</span>
            </Link>
            <nav aria-label={t('primaryNavigation')} className='hidden items-center gap-1 desktop:flex'>
              <Link href='/' aria-current={isDiscover ? 'page' : undefined} className={navClass(isDiscover)}>{t('discover')}</Link>
              <button
                type='button'
                onClick={handleFavoritesClick}
                aria-current={isFavorites ? 'page' : undefined}
                className={navClass(isFavorites)}
              >
                {t('favorites')}{favoriteCount}
              </button>
              <Link href='/contributors' aria-current={isContributors ? 'page' : undefined} className={navClass(isContributors)}>
                {t('contributors')}
              </Link>
            </nav>
          </div>

          <div className='hidden items-center gap-1 desktop:flex'>
            {user?.role === 'ADMIN' && (
              <Link href='/admin/addtools' className='inline-flex min-h-11 items-center gap-2 rounded-[6px] px-2.5 text-[12.5px] text-muted transition-colors hover:bg-surface-hover hover:text-accent'>
                Admin <span className='rounded-full bg-[var(--pink-dim)] px-2 py-0.5 text-[11px] text-[var(--pink)]'>●</span>
              </Link>
            )}
            <button type='button' onClick={toggleTheme} aria-label={theme === 'dark' ? t('lightTheme') : t('darkTheme')} title={theme === 'dark' ? t('lightTheme') : t('darkTheme')} className={ghostClass}>
              {theme === 'dark' ? <Sun aria-hidden='true' className='h-[17px] w-[17px]' strokeWidth={1.7} /> : <Moon aria-hidden='true' className='h-[17px] w-[17px]' strokeWidth={1.7} />}
            </button>
            <button type='button' onClick={toggleLocale} aria-label={t('language')} className='h-11 rounded-[6px] px-2.5 text-[12px] tracking-[0.05em] text-muted transition-colors hover:bg-[var(--mint-dim)] hover:text-accent'>
              <span className={locale === 'pt-BR' ? 'text-text' : ''}>PT</span>
              <span aria-hidden='true'> · </span>
              <span className={locale === 'en' ? 'text-text' : ''}>EN</span>
            </button>
            <Link href={repoUrl} target='_blank' rel='noopener noreferrer' aria-label={t('repository')} className={ghostClass}>
              <FaGithub aria-hidden='true' className='h-[17px] w-[17px]' />
            </Link>
            <button
              type='button'
              onClick={handleSuggestionClick}
              className='ml-1.5 inline-flex h-[38px] items-center gap-2 rounded-[6px] bg-accent px-3.5 text-[13px] font-semibold text-[var(--on-mint)] transition-[filter] hover:brightness-110'
            >
              <Plus aria-hidden='true' className='h-[14px] w-[14px]' strokeWidth={2.2} />
              {t('suggestTool')}
            </button>

            {!loading && user ? (
              <div className='relative ml-1'>
                <button type='button' onClick={() => setUserMenuOpen(v => !v)} aria-label={t('accountMenu')} aria-expanded={userMenuOpen} aria-haspopup='menu' className='grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-surface-hover'>
                  <img src={user.avatar} alt='' className='h-8 w-8 rounded-full border border-border-strong object-cover' />
                </button>
                {userMenuOpen && (
                  <div role='menu' className='dl-enter absolute right-0 top-[calc(100%+4px)] w-[220px] rounded-[10px] border border-border-strong bg-surface p-1.5 shadow-xl'>
                    <div className='mb-1 border-b border-border px-2.5 py-2'>
                      <div className='truncate text-[13px] font-semibold text-text'>{user.name}</div>
                      <div className='text-[11px] text-subtle'>{user.role === 'ADMIN' ? t('administrator') : t('member')}</div>
                    </div>
                    {user.role === 'ADMIN' && (
                      <Link href='/admin/addtools' role='menuitem' onClick={() => setUserMenuOpen(false)} className='block rounded-[6px] px-2.5 py-2 text-[12.5px] text-text hover:bg-surface-hover'>
                        {t('addToolAdmin')}
                      </Link>
                    )}
                    <button type='button' role='menuitem' onClick={handleLogout} className='flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[12.5px] text-text hover:bg-surface-hover'>
                      <LogOut aria-hidden='true' className='h-4 w-4' /> {t('signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <Link href='/login' aria-label='Sign in' className='ml-1 inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-border-strong px-3 text-[12.5px] text-text hover:border-[var(--mint-edge)]'>
                <UserRound aria-hidden='true' className='h-4 w-4' /> {t('signIn')}
              </Link>
            ) : <span className='h-9 w-9 animate-pulse rounded-full bg-surface-hover' />}
          </div>

          <button type='button' onClick={() => setMobileMenuOpen(v => !v)} aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')} aria-expanded={mobileMenuOpen} aria-controls='mobile-navigation' className='grid h-11 w-11 shrink-0 place-items-center rounded-[6px] text-muted hover:bg-surface-hover desktop:hidden'>
            {mobileMenuOpen ? <X aria-hidden='true' className='h-5 w-5' /> : <Menu aria-hidden='true' className='h-5 w-5' />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav id='mobile-navigation' aria-label={t('primaryNavigation')} className='dl-enter border-t border-border px-[clamp(16px,2.3vw,28px)] py-3 desktop:hidden'>
            <div className='mx-auto flex max-w-[1240px] flex-col gap-1'>
              <Link href='/' aria-current={isDiscover ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)} className={navClass(isDiscover)}>{t('discover')}</Link>
              <button type='button' onClick={handleFavoritesClick} aria-current={isFavorites ? 'page' : undefined} className={navClass(isFavorites)}>{t('favorites')}{favoriteCount}</button>
              <Link href='/contributors' aria-current={isContributors ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)} className={navClass(isContributors)}>{t('contributors')}</Link>
              {user?.role === 'ADMIN' && (
                <Link href='/admin/addtools' onClick={() => setMobileMenuOpen(false)} className={navClass(false)}>Admin</Link>
              )}
              <button type='button' onClick={toggleTheme} className={navClass(false)}>{theme === 'dark' ? t('lightTheme') : t('darkTheme')}</button>
              <button type='button' onClick={toggleLocale} className={navClass(false)}>{t('language')}: {locale === 'en' ? 'Português' : 'English'}</button>
              <Link href={repoUrl} target='_blank' rel='noopener noreferrer' className={navClass(false)}>GitHub</Link>
              <button type='button' onClick={handleSuggestionClick} className='my-1 flex min-h-10 items-center justify-center gap-2 rounded-[6px] bg-accent px-4 text-[13px] font-semibold text-[var(--on-mint)]'>
                <Plus aria-hidden='true' className='h-4 w-4' /> {t('suggestTool')}
              </button>
              {user ? (
                <button type='button' onClick={handleLogout} className={navClass(false)}><LogOut aria-hidden='true' className='h-4 w-4' /> {t('signOut')}</button>
              ) : !loading ? (
                <Link href='/login' onClick={() => setMobileMenuOpen(false)} className={navClass(false)}>{t('signIn')}</Link>
              ) : null}
            </div>
          </nav>
        )}
      </header>

      <AddSuggestionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
