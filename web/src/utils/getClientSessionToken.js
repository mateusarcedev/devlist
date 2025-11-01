const SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
]

const getClientSessionToken = () => {
  if (typeof document === 'undefined' || !document.cookie) {
    return null
  }

  const cookies = document.cookie.split(';').map(cookie => cookie.trim())

  for (const name of SESSION_COOKIE_NAMES) {
    const prefix = `${name}=`
    const match = cookies.find(cookie => cookie.startsWith(prefix))

    if (match) {
      return decodeURIComponent(match.slice(prefix.length))
    }
  }

  return null
}

export default getClientSessionToken

