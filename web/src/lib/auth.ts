// web/src/lib/auth.ts
import { AxiosConfig } from '@/utils'
import GithubProvider from 'next-auth/providers/github'
import type { GithubProfile } from 'next-auth/providers/github'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile: GithubProfile) {
        return {
          id: String(profile.id),
          name: profile.name ?? null,
          email: profile.email ?? null,
          avatar_url: profile.avatar_url,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!profile) return false
      const githubProfile = profile as GithubProfile
      const { id, name, email, avatar_url } = githubProfile

      try {
        const res = await AxiosConfig.post<{ role: 'USER' | 'ADMIN' }>('/users', {
          githubId: parseInt(String(id)),
          name: name ?? 'Unknown',
          email: email ?? '',
          avatar: avatar_url ?? '',
        })

        if (res.status === 200 || res.status === 201) {
          user.role = res.data.role
          return true
        }
        console.error('Error saving user in backend')
        return false
      } catch (error) {
        console.error('Error connecting to the backend: ', error)
        return false
      }
    },
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        const githubProfile = profile as GithubProfile
        token.githubId = parseInt(String(githubProfile.id))
        token.avatar_url = githubProfile.avatar_url
      }
      if (user?.role) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubId = token.githubId
        session.user.avatar_url = token.avatar_url
        session.user.role = token.role ?? 'USER'
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}
