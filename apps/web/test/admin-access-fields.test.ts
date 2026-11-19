import { describe, expect, it } from 'vitest'
import { parseFields } from '../src/lib/admin-suggestions'

const base = { name: 'Astro', description: 'Framework', categoryId: '0f964c70-6ab1-4e48-8d9b-09f3a5018420' }

describe('suggestion access validation', () => {
  it('accepts allowed models and optional HTTPS evidence', () => {
    expect(parseFields({ ...base, accessModel: 'OPEN_SOURCE', sourceUrl: 'https://astro.build/' })).toMatchObject({
      accessModel: 'OPEN_SOURCE', sourceUrl: 'https://astro.build/',
    })
  })
  it('rejects fabricated models and invalid evidence URLs', () => {
    expect(parseFields({ ...base, accessModel: 'ALWAYS_FREE' })).toBeNull()
    expect(parseFields({ ...base, accessModel: 'FREE', sourceUrl: 'http://not-secure.com' })).toBeNull()
  })
  it('defaults legacy drafts to unverified rather than free', () => {
    expect(parseFields(base)?.accessModel).toBe('UNVERIFIED')
  })
})
