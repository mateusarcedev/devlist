'use client'

import { AxiosConfig } from '@/utils'
import { createClient } from '@/lib/supabase/browser'
import type { OnFavoriteChange, Tool } from '@/types'
import { useAuth } from './useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dispatch, SetStateAction, useState } from 'react'
import { getApiErrorMessage } from '@/lib/http-error'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

interface FavoriteState {
  toolId: string
  userId: string
  value: boolean
}

interface UseFavoriteToggleReturn {
  isFavorite: boolean
  toast: ToastState | null
  setToast: Dispatch<SetStateAction<ToastState | null>>
  toggle: (onFavoriteChange?: OnFavoriteChange) => Promise<void>
  isAuthLoading: boolean
}

const FAVORITES_QUERY_KEY = 'favorite-tool-ids'

// All visible tool cards share a *single* Supabase query through React Query.
// Previously, every card made its own getUser + SELECT request on each mount.
export function useFavoriteToggle(
  tool: Tool,
  initialIsFavorite = false,
): UseFavoriteToggleReturn {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()
  const [favoriteState, setFavoriteState] = useState<FavoriteState | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const userId = user?.id
  const queryKey = [FAVORITES_QUERY_KEY, userId]

  const favoritesQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<string[]> => {
      if (!userId) return []
      const { data, error } = await createClient()
        .from('favorites')
        .select('tool_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map(row => row.tool_id)
    },
    enabled: Boolean(userId) && !loading,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const isFavorite = !userId
    ? false
    : favoriteState?.toolId === tool.id && favoriteState.userId === userId
      ? favoriteState.value
      : initialIsFavorite || (favoritesQuery.data?.includes(tool.id) ?? false)

  const toggle = async (onFavoriteChange?: OnFavoriteChange): Promise<void> => {
    if (!userId) {
      setToast({ message: 'Please log in to add to favorites.', type: 'error' })
      return
    }

    const previousFavoriteStatus = isFavorite
    const newFavoriteStatus = !previousFavoriteStatus
    setFavoriteState({ toolId: tool.id, userId, value: newFavoriteStatus })

    try {
      await AxiosConfig.post('/favorites/toggle', { toolId: tool.id })

      queryClient.setQueryData<string[]>(queryKey, current => {
        const ids = current ?? []
        return newFavoriteStatus
          ? ids.includes(tool.id) ? ids : [...ids, tool.id]
          : ids.filter(id => id !== tool.id)
      })

      setToast({
        message: `${tool.name} ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`,
        type: 'success',
      })
      onFavoriteChange?.(tool.id, newFavoriteStatus)
    } catch (error: unknown) {
      setFavoriteState({ toolId: tool.id, userId, value: previousFavoriteStatus })
      setToast({
        message: getApiErrorMessage(
          error,
          'An error occurred while updating favorites. Please try again.',
        ),
        type: 'error',
      })
    }
  }

  return {
    isFavorite,
    toast,
    setToast,
    toggle,
    // Prevent accidental remove/add before the shared favorite list arrives.
    isAuthLoading: loading || (Boolean(userId) && favoritesQuery.isPending && !initialIsFavorite),
  }
}
