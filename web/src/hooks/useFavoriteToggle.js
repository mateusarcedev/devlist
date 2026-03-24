'use client'

import { AxiosConfig } from '@/utils'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function useFavoriteToggle(tool, initialIsFavorite = false) {
  const { data: session, status } = useSession()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user?.githubId &&
      !initialIsFavorite
    ) {
      const fetchFavoriteStatus = async () => {
        try {
          const response = await AxiosConfig.get('/favorites/check', {
            params: { toolId: tool.id },
          })
          setIsFavorite(response.data.isFavorite)
        } catch (error) {
          console.error('Error checking favorite', error)
        }
      }
      fetchFavoriteStatus()
    }

    if (status === 'unauthenticated') {
      setIsFavorite(false)
    }
  }, [session, status, initialIsFavorite, tool.id])

  const toggle = async onFavoriteChange => {
    if (status !== 'authenticated' || !session?.user?.githubId) {
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
    } catch (error) {
      setIsFavorite(previousFavoriteStatus)
      setToast({
        message:
          error.response?.data?.message ||
          'An error occurred while updating favorites. Please try again.',
        type: 'error',
      })
    }
  }

  return {
    isFavorite,
    toast,
    setToast,
    toggle,
    isAuthLoading: status === 'loading',
  }
}
