import { jwtVerify } from 'jose'

export async function hasValidAccessToken(
  token: string | undefined,
  jwtSecret: string | undefined,
): Promise<boolean> {
  if (!token || !jwtSecret) return false

  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    return true
  } catch {
    return false
  }
}
