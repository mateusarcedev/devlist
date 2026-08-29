'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import AxiosConfig from '@/utils/axiosConfig'

export interface AuthUser {
  githubId: number
  name: string
  avatar: string
  role: 'USER' | 'ADMIN'
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AxiosConfig.get<AuthUser>('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(async () => {
    try {
      await AxiosConfig.post('/auth/logout')
    } finally {
      setUser(null)
      window.location.href = '/'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
