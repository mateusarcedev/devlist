import { describe, expect, it } from 'vitest'
import { normalizeSuggestionUrl, SuggestionUrlError } from '../src/lib/suggestion-url'

describe('normalizeSuggestionUrl', () => {
  it('accepts links without a scheme and normalizes www for matching', () => {
    expect(normalizeSuggestionUrl('  www.exemplo.com/docs  ')).toEqual({
      url: 'https://www.exemplo.com/docs',
      host: 'exemplo.com',
    })
  })

  it('preserves GitHub repository paths for duplicate checks', () => {
    expect(normalizeSuggestionUrl('github.com/a/repo')).toEqual({
      url: 'https://github.com/a/repo',
      host: 'github.com',
    })
    expect(normalizeSuggestionUrl('github.com/b/repo').url).not.toBe(
      normalizeSuggestionUrl('github.com/a/repo').url,
    )
  })

  it('treats GitHub www and http links as the same repository URL', () => {
    const canonical = normalizeSuggestionUrl('github.com/a/repo').url
    expect(normalizeSuggestionUrl('http://www.github.com/a/repo').url).toBe(canonical)
    expect(normalizeSuggestionUrl('https://github.com/a/other').url).not.toBe(canonical)
  })

  it('removes URL fragments and retains a valid path/query', () => {
    expect(normalizeSuggestionUrl('https://example.com/path?view=1#intro')).toEqual({
      url: 'https://example.com/path?view=1',
      host: 'example.com',
    })
  })

  it('rejects blank and unsafe inputs', () => {
    expect(() => normalizeSuggestionUrl('')).toThrow('Cole o link da ferramenta.')
    for (const value of [
      'not a URL', 'javascript://example.com', 'ftp://example.com',
      'http://localhost', 'http://127.0.0.1', 'http://192.168.1.2',
      'http://user:password@example.com', 'https://example.com:8080',
      'https://-bad.com', 'https://example.com?q=a b',
    ]) {
      expect(() => normalizeSuggestionUrl(value), value).toThrow(SuggestionUrlError)
    }
  })
})
