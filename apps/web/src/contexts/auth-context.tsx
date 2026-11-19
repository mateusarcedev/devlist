'use client'

import { createClient } from '@/lib/supabase/browser'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  githubId: number | null
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
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let seq = 0
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      queueMicrotask(() => { if (active) setLoading(false) })
      return
    }

    async function loadUser() {
      const mySeq = ++seq
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser()
        if (authError || !auth.user) {
          if (active && seq === mySeq) setUser(null)
          return
        }
        const { data, error } = await supabase.from('profiles')
          .select('id, github_id, name, avatar, role')
          .eq('id', auth.user.id)
          .single()
        if (active && seq === mySeq) {
          setUser(error || !data ? null : {
            id: data.id,
            githubId: data.github_id,
            name: data.name,
            avatar: data.avatar,
            role: data.role,
          })
        }
      } catch {
        if (active && seq === mySeq) setUser(null)
      } finally {
        if (active && seq === mySeq) setLoading(false)
      }
    }

    void loadUser()
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // Defers other Supabase calls outside the auth callback lock.
      queueMicrotask(() => { if (active) void loadUser() })
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await createClient().auth.signOut()
    } finally {
      setUser(null)
      router.replace('/')
      router.refresh()
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuthContext must be used within AuthProvider')
  return value
}
