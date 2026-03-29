'use client'

import { AxiosConfig } from '@/utils'
import type { Suggestion } from '@/types'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'

interface SuggestionData {
  name: string
  link: string
  description: string
  categoryId: string
}

interface UseSubmitSuggestionOptions {
  onSuccess?: (data: Suggestion) => void
  onError?: (error: unknown) => void
}

export function useSubmitSuggestion({
  onSuccess,
  onError,
}: UseSubmitSuggestionOptions = {}): UseMutationResult<Suggestion, unknown, SuggestionData> {
  return useMutation({
    mutationFn: async (suggestionData: SuggestionData): Promise<Suggestion> => {
      const { data } = await AxiosConfig.post<Suggestion>('/suggestions', suggestionData)
      return data
    },
    onSuccess,
    onError,
  })
}
