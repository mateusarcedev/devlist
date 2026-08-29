'use client'

import {
  FolderHeartIcon,
  Github,
  LogOut,
  PlusCircle,
  User2Icon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [toast, setToast] = useState<ToastState | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ message, type })
  }

  const handleFavoritesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!user) {
      showToast('Log in to access your favorites!', 'warning')
      return
    }
    router.push('/favorites')
  }

  const handleSuggestionClick = () => {
    if (!user) {
      showToast('Log in to suggest a tool!', 'warning')
      return
    }
    setIsModalOpen(true)
  }

  const handleModalSubmit = (result: SubmitResult) => {
    if (result.status === 'success') {
      showToast('Suggestion sent successfully!', 'success')
      return
    }
    showToast(result.message ?? 'Error sending suggestion. Please try again.', 'error')
  }

  return (
    <>
      <nav className='bg-navbar text-white flex items-center justify-center flex-wrap gap-3 tablet:gap-0 p-5 tablet:justify-between'>
        <Link href='/' className='text-3xl font-bold hover:text-white/80'>
          Tools4.tech
        </Link>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleFavoritesClick}
            className='p-2 bg-black hover:bg-black/80 rounded-md transition-colors duration-200 group relative'
          >
            <FolderHeartIcon className='h-5 w-5 text-white' />
            <span className='sr-only'>Favorites</span>
            <span className='absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-sm py-1 px-2 top-full left-1/2 transform -translate-x-1/2 mt-2'>
              Favorites
            </span>
          </button>

          <Link
            href='https://github.com/mateusarcedev/devlinks/'
            target='_blank'
            rel='noopener noreferrer'
            className='p-2 bg-black hover:bg-black/80 rounded-md transition-colors duration-200 group relative'
          >
            <Github className='h-5 w-5 text-white' />
            <span className='sr-only'>Github</span>
            <span className='absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-sm py-1 px-2 top-full left-1/2 transform -translate-x-1/2 mt-2'>
              Github
            </span>
          </Link>

          <button
            onClick={handleSuggestionClick}
            className='p-2 bg-black hover:bg-black/80 rounded-md transition-colors duration-200 group relative'
          >
            <PlusCircle className='h-5 w-5 text-white' />
            <span className='sr-only'>Suggest a tool</span>
            <span className='absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-sm py-1 px-2 top-full left-1/2 transform -translate-x-1/2 mt-2'>
              Suggest a tool
            </span>
          </button>

          {!loading && user ? (
            <>
              <span className='opacity-20'>|</span>
              <div className='flex items-center w-8 h-8 bg-zinc-800 rounded-full'>
                <img
                  src={user.avatar}
                  alt={user.name ?? ''}
                  className='w-full h-full object-cover rounded-full'
                />
              </div>
              <button
                onClick={logout}
                className='p-2 bg-black hover:bg-black/80 rounded-md transition-colors duration-200 group relative'
              >
                <LogOut className='h-5 w-5 text-white' />
                <span className='sr-only'>Logout</span>
                <span className='absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-sm py-1 px-2 top-full left-1/2 transform -translate-x-1/2 mt-2'>
                  Logout
                </span>
              </button>
            </>
          ) : !loading ? (
            <button
              onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_URL_API}/auth/github` }}
              className='p-2 bg-black hover:bg-black/80 rounded-md transition-colors duration-200 group relative'
            >
              <User2Icon className='h-5 w-5 text-white' />
              <span className='sr-only'>Log in with GitHub</span>
              <span className='absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-sm py-1 px-2 top-full left-1/2 transform -translate-x-1/2 mt-2'>
                Log in with GitHub
              </span>
            </button>
          ) : null}
        </div>
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
