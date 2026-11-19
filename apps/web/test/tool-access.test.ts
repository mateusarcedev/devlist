import { describe, expect, it } from 'vitest'
import { accessModelForTool, isPublishableAccessModel, legacyAccessModel } from '../src/lib/tool-access'

describe('tool access model', () => {
  it('never assumes an unknown resource is free', () => {
    expect(legacyAccessModel('https://unknown-example.dev')).toBe('UNVERIFIED')
    expect(legacyAccessModel('not a url')).toBe('UNVERIFIED')
  })
  it('recognizes a conservative set of known legacy resources', () => {
    expect(legacyAccessModel('https://astro.build/')).toBe('OPEN_SOURCE')
    expect(legacyAccessModel('https://fonts.google.com/')).toBe('FREE')
    expect(legacyAccessModel('https://bannerify.co/')).toBe('FREEMIUM')
    expect(legacyAccessModel('https://tailwindui.com/')).toBe('PAID')
  })
  it('treats the database value as authoritative', () => {
    expect(accessModelForTool('FREE','https://tailwindui.com/')).toBe('FREE')
    expect(accessModelForTool(null,'https://tailwindui.com/')).toBe('PAID')
  })
  it('blocks paid and unverified tools from new approvals', () => {
    expect(isPublishableAccessModel('OPEN_SOURCE')).toBe(true)
    expect(isPublishableAccessModel('FREE')).toBe(true)
    expect(isPublishableAccessModel('FREEMIUM')).toBe(true)
    expect(isPublishableAccessModel('PAID')).toBe(false)
    expect(isPublishableAccessModel('UNVERIFIED')).toBe(false)
  })
})
