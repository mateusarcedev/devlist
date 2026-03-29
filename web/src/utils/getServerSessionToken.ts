import { cookies } from 'next/headers'

const SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
] as const

const getServerSessionToken = async (): Promise<string | null> => {
  const cookieStore = await cookies()

  for (const name of SESSION_COOKIE_NAMES) {
    const value = cookieStore.get(name)?.value

    if (value) {
      return value
    }
  }

  return null
}

export default getServerSessionToken
