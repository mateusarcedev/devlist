import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import postcss from 'postcss'

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8')
const root = postcss.parse(css)

function tokens(selector: string) {
  const declarations = new Map<string, string>()
  root.walkRules(rule => {
    if (rule.selectors?.includes(selector)) {
      rule.walkDecls(declaration => {
        declarations.set(declaration.prop, declaration.value)
      })
    }
  })
  return declarations
}

describe('DevHub redesign tokens — HANDOFF.md', () => {
  it('matches the charcoal dark palette', () => {
    const dark = tokens(':root[data-theme=\'dark\']')
    expect(dark.get('--bg')).toBe('#151515')
    expect(dark.get('--surface')).toBe('#1d1d1d')
    expect(dark.get('--fg')).toBe('#f4f4f4')
    expect(dark.get('--mint')).toBe('#15f5ba')
    expect(dark.get('--pink')).toBe('#e96479')
    expect(dark.get('--on-mint')).toBe('#0e0e0e')
  })

  it('matches the warm light palette', () => {
    const light = tokens(':root[data-theme=\'light\']')
    expect(light.get('--bg')).toBe('#f5f3ee')
    expect(light.get('--surface')).toBe('#ffffff')
    expect(light.get('--fg')).toBe('#1a1a17')
    expect(light.get('--mint')).toBe('#076b39')
    expect(light.get('--pink')).toBe('#a02f69')
    expect(light.get('--on-mint')).toBe('#ffffff')
  })

  it('keeps legacy Tailwind color utilities theme-aware', () => {
    // PostCSS represents @theme as at-rules, so inspect aliases directly.
    expect(css).toContain('--color-canvas: var(--bg)')
    expect(css).toContain('--color-text: var(--fg)')
    expect(css).toContain('--color-accent: var(--mint)')
    expect(css).toContain('--font-mono: var(--font-geist-mono)')
  })
})
