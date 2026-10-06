'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'pt-BR'

const messages = {
  en: {
    discover: 'Discover', favorites: 'Favorites', contributors: 'Contributors',
    suggestTool: 'Suggest a tool', signIn: 'Sign in', signOut: 'Sign out',
    administrator: 'Administrator', member: 'Member', addToolAdmin: 'Add a tool (admin)',
    loginFavorites: 'Log in to access your favorites!', suggestionSent: 'Suggestion sent successfully!',
    suggestionError: 'Error sending suggestion. Please try again.', accountMenu: 'Account menu',
    openMenu: 'Open navigation menu', closeMenu: 'Close navigation menu',
    repository: 'GitHub repository', language: 'Language',
    communityTools: 'Community-curated developer tools', builtBy: 'Built by Mateus Arce',
    skipContent: 'Skip to content',
  },
  'pt-BR': {
    discover: 'Descobrir', favorites: 'Favoritos', contributors: 'Colaboradores',
    suggestTool: 'Sugerir ferramenta', signIn: 'Entrar', signOut: 'Sair',
    administrator: 'Administrador', member: 'Membro', addToolAdmin: 'Adicionar ferramenta (admin)',
    loginFavorites: 'Entre para acessar seus favoritos!', suggestionSent: 'Sugestão enviada com sucesso!',
    suggestionError: 'Erro ao enviar a sugestão. Tente novamente.', accountMenu: 'Menu da conta',
    openMenu: 'Abrir menu de navegação', closeMenu: 'Fechar menu de navegação',
    repository: 'Repositório no GitHub', language: 'Idioma',
    communityTools: 'Ferramentas para desenvolvedores selecionadas pela comunidade', builtBy: 'Criado por Mateus Arce',
    skipContent: 'Pular para o conteúdo',
  },
} as const

type MessageKey = keyof typeof messages.en
interface I18nValue { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string }
const I18nContext = createContext<I18nValue>({ locale: 'en', setLocale: () => undefined, t: key => messages.en[key] })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = window.localStorage.getItem('devlist-locale')
    if (saved === 'en' || saved === 'pt-BR') {
      setLocaleState(saved)
      return
    }
    if (navigator.language.toLowerCase().startsWith('pt')) setLocaleState('pt-BR')
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem('devlist-locale', next)
    document.documentElement.lang = next === 'pt-BR' ? 'pt-BR' : 'en'
  }

  useEffect(() => {
    document.documentElement.lang = locale === 'pt-BR' ? 'pt-BR' : 'en'
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => messages[locale][key] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  return context
}
