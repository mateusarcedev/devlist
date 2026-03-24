'use client'

import { AxiosConfig } from '@/utils'
import { useMutation } from '@tanstack/react-query'

export function useSubmitSuggestion({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: async suggestionData => {
      const { data } = await AxiosConfig.post('/suggestions', suggestionData)
      return data
    },
    onSuccess,
    onError,
  })
}
