'use client'

import { useMutation, type UseMutationResult } from '@tanstack/react-query'

export interface SubmittedSuggestion {
  id: string
  host: string
}

export interface SuggestionData {
  url: string
}

interface UseSubmitSuggestionOptions {
  onSuccess?: (data: SubmittedSuggestion) => void
  onError?: (error: unknown) => void
}

export class SuggestionSubmitError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'SuggestionSubmitError'
  }
}

export function useSubmitSuggestion({
  onSuccess,
  onError,
}: UseSubmitSuggestionOptions = {}): UseMutationResult<SubmittedSuggestion, unknown, SuggestionData> {
  return useMutation({
    mutationFn: async ({ url }): Promise<SubmittedSuggestion> => {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const message = typeof result === 'object' && result !== null &&
          'message' in result && typeof result.message === 'string'
          ? result.message : 'Não foi possível enviar a sugestão. Tente novamente.'
        throw new SuggestionSubmitError(message, response.status)
      }
      if (!result || typeof result !== 'object' ||
        !('id' in result) || typeof result.id !== 'string' ||
        !('host' in result) || typeof result.host !== 'string') {
        throw new SuggestionSubmitError('Resposta inesperada do servidor.', 502)
      }
      return { id: result.id, host: result.host }
    },
    onSuccess,
    onError,
  })
}
