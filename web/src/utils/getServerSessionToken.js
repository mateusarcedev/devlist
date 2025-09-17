import { cookies } from 'next/headers'

const SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
]

const getServerSessionToken = () => {
  const cookieStore = cookies()

  for (const name of SESSION_COOKIE_NAMES) {
    const value = cookieStore.get(name)?.value

    if (value) {
      return value
    }
  }

  return null
}

export default getServerSessionToken

