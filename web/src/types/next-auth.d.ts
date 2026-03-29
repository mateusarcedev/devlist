// web/src/types/next-auth.d.ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role?: 'USER' | 'ADMIN'
  }

  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      githubId: number
      avatar_url: string
      role: 'USER' | 'ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    githubId: number
    avatar_url: string
    role?: 'USER' | 'ADMIN'
  }
}
