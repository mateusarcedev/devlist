import { describe, expect, it } from 'vitest'
import { withReferral } from '../src/lib/tool-url'

describe('withReferral', () => {
  it('adds the tools4.tech referral to a plain URL', () => {
    expect(withReferral('https://example.com/tool')).toBe(
      'https://example.com/tool?ref=tools4.tech',
    )
  })

  it('preserves existing query parameters', () => {
    expect(withReferral('https://example.com/tool?utm_source=github')).toBe(
      'https://example.com/tool?utm_source=github&ref=tools4.tech',
    )
  })

  it('preserves URL fragments', () => {
    expect(withReferral('https://example.com/tool#pricing')).toBe(
      'https://example.com/tool?ref=tools4.tech#pricing',
    )
  })

  it('replaces an existing ref instead of duplicating it', () => {
    expect(withReferral('https://example.com/tool?ref=old')).toBe(
      'https://example.com/tool?ref=tools4.tech',
    )
  })
})
