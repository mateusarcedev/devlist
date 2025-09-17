import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { AxiosConfig } from '@/utils';

// Configuração do NextAuth (não exportada)
export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const { id, name, email, avatar_url } = profile;

      try {
        const res = await AxiosConfig.post('/users', {
          githubId: parseInt(id),
          name: name || 'Unknown',
          email: email || '',
          avatar: avatar_url || '',
        });

        if (res.status === 200 || res.status === 201) {
          user.role = res.data.role;
          return true;
        } else {
          console.error('Error saving user in backend');
          return false;
        }
      } catch (error) {
        console.error('Error connecting to the backend: ', error);
        return false;
      }
    },
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        token.githubId = parseInt(profile.id);
        token.avatar_url = profile.avatar_url;
      }
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubId = token.githubId;
        session.user.avatar_url = token.avatar_url;
        session.user.role = token.role;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

// Inicializa o NextAuth
const handler = NextAuth(authOptions);

// Exporta as funções GET e POST para o App Router
export { handler as GET, handler as POST };