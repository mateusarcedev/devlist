import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '../src/lib/http-error'

class ApiError extends Error {
  response?: { data?: { message?: unknown } }

  constructor(message?: unknown) {
    super('request failed')
    this.response = { data: { message } }
  }
}

describe('getApiErrorMessage', () => {
  it('returns a backend message when it is a non-empty string', () => {
    expect(getApiErrorMessage(new ApiError('Already exists'), 'Fallback')).toBe(
      'Already exists',
    )
  })

  it('falls back for blank backend messages', () => {
    expect(getApiErrorMessage(new ApiError('   '), 'Fallback')).toBe('Fallback')
  })

  it('falls back for malformed response payloads', () => {
    expect(getApiErrorMessage(new ApiError(123), 'Fallback')).toBe('Fallback')
  })

  it('falls back for non-HTTP errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Fallback')).toBe('Fallback')
  })
})
