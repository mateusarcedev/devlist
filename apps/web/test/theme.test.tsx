import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../src/contexts/theme-context'

function Consumer() {
  const { theme, toggleTheme } = useTheme()
  return <button onClick={toggleTheme}>{theme}</button>
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({ matches: false })),
    })
  })

  it('defaults to dark and persists a manual toggle', () => {
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('dark')
    act(() => screen.getByRole('button').click())
    expect(screen.getByRole('button')).toHaveTextContent('light')
    expect(localStorage.getItem('devlist-theme')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('restores a saved theme', () => {
    localStorage.setItem('devlist-theme', 'light')
    render(<ThemeProvider><Consumer /></ThemeProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('light')
  })
})
