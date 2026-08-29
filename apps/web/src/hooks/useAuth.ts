'use client'

import { useAuthContext } from '@/contexts/auth-context'

export function useAuth() {
  return useAuthContext()
}
