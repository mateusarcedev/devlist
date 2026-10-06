import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { hasValidAccessToken } from '../src/lib/proxy-auth'

const secret = 'test-jwt-secret-with-enough-entropy'

async function tokenFor(role: 'USER' | 'ADMIN') {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('123')
    .setIssuedAt()
    .sign(new TextEncoder().encode(secret))
}

describe('hasValidAccessToken', () => {
  it('accepts a valid token regardless of its embedded role', async () => {
    await expect(hasValidAccessToken(await tokenFor('USER'), secret)).resolves.toBe(
      true,
    )
    await expect(
      hasValidAccessToken(await tokenFor('ADMIN'), secret),
    ).resolves.toBe(true)
  })

  it('rejects missing or invalid tokens', async () => {
    await expect(hasValidAccessToken(undefined, secret)).resolves.toBe(false)
    await expect(hasValidAccessToken('invalid-token', secret)).resolves.toBe(false)
    await expect(hasValidAccessToken(await tokenFor('USER'), undefined)).resolves.toBe(
      false,
    )
  })
})
