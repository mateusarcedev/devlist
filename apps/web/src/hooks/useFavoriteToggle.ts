'use client'

import { AxiosConfig } from '@/utils'
import type { OnFavoriteChange, Tool } from '@/types'
import { useAuth } from './useAuth'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

interface UseFavoriteToggleReturn {
  isFavorite: boolean
  toast: ToastState | null
  setToast: Dispatch<SetStateAction<ToastState | null>>
  toggle: (onFavoriteChange?: OnFavoriteChange) => Promise<void>
  isAuthLoading: boolean
}

export function useFavoriteToggle(
  tool: Tool,
  initialIsFavorite = false,
): UseFavoriteToggleReturn {
  const { user, loading } = useAuth()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  useEffect(() => {
    if (!loading && user && !initialIsFavorite) {
      const fetchFavoriteStatus = async () => {
        try {
          const response = await AxiosConfig.get<{ isFavorite: boolean }>(
            '/favorites/check',
            { params: { toolId: tool.id } },
          )
          setIsFavorite(response.data.isFavorite)
        } catch (error) {
          console.error('Error checking favorite', error)
        }
      }
      fetchFavoriteStatus()
    }

    if (!loading && !user) {
      setIsFavorite(false)
    }
  }, [user, loading, initialIsFavorite, tool.id])

  const toggle = async (onFavoriteChange?: OnFavoriteChange): Promise<void> => {
    if (!user) {
      setToast({ message: 'Please log in to add to favorites.', type: 'error' })
      return
    }

    const previousFavoriteStatus = isFavorite

    try {
      const newFavoriteStatus = !previousFavoriteStatus
      setIsFavorite(newFavoriteStatus)

      await AxiosConfig.post('/favorites/toggle', { toolId: tool.id })

      setToast({
        message: `${tool.name} ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`,
        type: 'success',
      })

      onFavoriteChange?.(tool.id, newFavoriteStatus)
    } catch (error: unknown) {
      setIsFavorite(previousFavoriteStatus)
      const message =
        error instanceof Error &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'An error occurred while updating favorites. Please try again.'
      setToast({ message, type: 'error' })
    }
  }

  return {
    isFavorite,
    toast,
    setToast,
    toggle,
    isAuthLoading: loading,
  }
}
