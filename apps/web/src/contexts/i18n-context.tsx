'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'pt-BR'

const messages = {
  en: {
    discover: 'Discover', favorites: 'Favorites', contributors: 'Contributors',
    contributorsHeading: 'Contributors',
    contributorsCodeHeading: 'Code contributors',
    contributorsCodeDescription: 'People with commits merged into the DevHub GitHub repository.',
    contributorsCodeCount: 'developers',
    contributorsCodeUnavailable: 'Could not load GitHub contributors right now. Approved suggestions below remain available.',
    contributorsNoCode: 'No public GitHub commit authors found yet.',
    contributorsGithubGraph: 'View contributors on GitHub',
    contributorsCommits: 'commits',
    contributorsCatalogHeading: 'Tool contributors',
    contributorsCatalogDescription: 'Credits from approved suggestions, independent of GitHub commits.',

    contributorsDescription: 'People who contribute code on GitHub and suggest tools for DevHub.',
    contributorsSortLabel: 'Sort contributors',
    contributorsMostApproved: 'Most approved',
    contributorsMostRecent: 'Most recent',
    contributorsMaintainer: 'maintainer',
    contributorsSince: 'since',
    contributorsApprovedLabel: 'approved',
    contributorsLatest: 'Latest',
    contributorsProfile: 'GitHub profile',
    contributorsCTA: 'Want to appear here? Send the link to a tool you use.',
    contributorsEmptyTitle: 'No approved contributions yet',
    contributorsEmptyDescription: 'Approved tool suggestions will appear here. You can be the first.',
    contributorsErrorTitle: 'Contributors unavailable',
    contributorsErrorDescription: 'We could not load approved contributions. Please try again.',

    suggestTool: 'Suggest a tool', signIn: 'Sign in', signOut: 'Sign out',
    suggestUrlDescription: 'Just the link. Name, description and category are completed during review.',
    suggestLinkLabel: 'Tool link', suggestInvalidUrl: 'This link does not look valid. E.g. https://example.com',
    suggestErrorGeneric: 'Could not submit the suggestion. Try again.',
    suggestSubmittingAs: 'Submitting as', suggestSignInGithub: 'Sign in with GitHub',
    suggestSubmit: 'Submit suggestion', suggestSending: 'Sending...',
    suggestSentTitle: 'Suggestion submitted',
    suggestSentDescription: 'is in the review queue. When published, you will appear in Contributors.',
    suggestAnother: 'Suggest another', close: 'Close', cancel: 'Cancel',

    administrator: 'Administrator', member: 'Member', addToolAdmin: 'Add a tool (admin)',
    loginFavorites: 'Log in to access your favorites!', suggestionSent: 'Suggestion sent successfully!',
    suggestionError: 'Error sending suggestion. Please try again.', accountMenu: 'Account menu',
    openMenu: 'Open navigation menu', closeMenu: 'Close navigation menu',
    repository: 'GitHub repository', language: 'Language', theme: 'Theme', lightTheme: 'Use light theme', darkTheme: 'Use dark theme',
    communityTools: 'Community-curated developer tools', builtBy: 'Built by Mateus Arce',
    catalogCrumb: 'catalog', primaryNavigation: 'Main navigation',
    discoverHeading: 'Discover tools',
    discoverDescription: 'Community-curated tools for developers.',
    toolsCount: 'tools', categoriesCount: 'categories', categoriesLabel: 'Categories',
    inCatalog: 'in the catalog', resultSingle: 'result', resultPlural: 'results',
    searchLabel: 'Search tools', noResultsHeading: 'Nothing found',
    noResultsDescription: 'Try another search or category. Missing a tool? Suggest it to the community.',
    catalogErrorHeading: "We couldn't load the directory",
    catalogErrorDescription: 'The catalog is temporarily unavailable.',
    suggestOne: 'Suggest a tool', showing: 'Showing', of: 'of', loadMore: 'Load more',
    viewCategory: 'View full category:', contributePrompt: 'Missing a tool? Send the link — our reviewers take care of the rest.',
    saveFavorite: 'Save {name} to favorites', removeFavorite: 'Remove {name} from favorites',
    visit: 'Visit', footerDescription: 'devhub · developer tools curated by the community',
    footerLinks: 'Footer links', madeBy: 'made by',
    myFavorites: 'My favorites', savedTools: 'saved tools', savedToolSingle: 'saved tool',
    favoriteEmptyHeading: 'No favorites here yet',
    favoriteEmptyDescription: 'Tap the heart on a tool to save it here.',
    skipContent: 'Skip to content', discoverTools: 'Discover tools', searchTools: 'Search tools, categories, technologies...', all: 'All', allTools: 'All tools', loadToolsError: 'Something went wrong while fetching tools.', retry: 'Try again', noResults: 'No tools match your search', noTools: 'No tools found', trySearch: 'Try a different search term.',
  },
  'pt-BR': {
    discover: 'Descobrir', favorites: 'Favoritos', contributors: 'Contribuidores',
    contributorsHeading: 'Contribuidores',
    contributorsCodeHeading: 'Contribuidores de código',
    contributorsCodeDescription: 'Pessoas com commits integrados ao repositório do DevHub no GitHub.',
    contributorsCodeCount: 'desenvolvedores',
    contributorsCodeUnavailable: 'Não foi possível consultar o GitHub agora. As sugestões aprovadas continuam disponíveis abaixo.',
    contributorsNoCode: 'Ainda não encontramos autores de commits no GitHub.',
    contributorsGithubGraph: 'Ver contribuidores no GitHub',
    contributorsCommits: 'commits',
    contributorsCatalogHeading: 'Contribuidores de ferramentas',
    contributorsCatalogDescription: 'Créditos de sugestões aprovadas, separados dos commits do GitHub.',

    contributorsDescription: 'Quem contribui com código no GitHub ou sugere ferramentas para o DevHub.',
    contributorsSortLabel: 'Ordenar contribuidores',
    contributorsMostApproved: 'Mais aprovadas',
    contributorsMostRecent: 'Mais recentes',
    contributorsMaintainer: 'mantenedor',
    contributorsSince: 'desde',
    contributorsApprovedLabel: 'aprovadas',
    contributorsLatest: 'Últimas',
    contributorsProfile: 'Perfil no GitHub',
    contributorsCTA: 'Quer aparecer aqui? Envie o link de uma ferramenta que você usa.',
    contributorsEmptyTitle: 'Ainda não há contribuições aprovadas',
    contributorsEmptyDescription: 'As sugestões aprovadas vão aparecer aqui. Você pode ser a primeira pessoa a contribuir.',
    contributorsErrorTitle: 'Contribuidores indisponíveis',
    contributorsErrorDescription: 'Não foi possível carregar as contribuições aprovadas. Tente novamente.',

    suggestTool: 'Sugerir ferramenta', signIn: 'Entrar', signOut: 'Sair',
    suggestUrlDescription: 'Só o link. Nome, descrição e categoria são preenchidos na revisão.',
    suggestLinkLabel: 'Link da ferramenta', suggestInvalidUrl: 'Esse link não parece válido. Ex.: https://exemplo.com',
    suggestErrorGeneric: 'Não foi possível enviar a sugestão. Tente novamente.',
    suggestSubmittingAs: 'Enviando como', suggestSignInGithub: 'Entrar com GitHub',
    suggestSubmit: 'Enviar sugestão', suggestSending: 'Enviando...',
    suggestSentTitle: 'Sugestão enviada',
    suggestSentDescription: 'entrou na fila de revisão. Quando for publicada, você aparece em Contribuidores.',
    suggestAnother: 'Sugerir outra', close: 'Fechar', cancel: 'Cancelar',

    administrator: 'Administrador', member: 'Membro', addToolAdmin: 'Adicionar ferramenta (admin)',
    loginFavorites: 'Entre para acessar seus favoritos!', suggestionSent: 'Sugestão enviada com sucesso!',
    suggestionError: 'Erro ao enviar a sugestão. Tente novamente.', accountMenu: 'Menu da conta',
    openMenu: 'Abrir menu de navegação', closeMenu: 'Fechar menu de navegação',
    repository: 'Repositório no GitHub', language: 'Idioma', theme: 'Tema', lightTheme: 'Usar tema claro', darkTheme: 'Usar tema escuro',
    communityTools: 'Ferramentas para desenvolvedores selecionadas pela comunidade', builtBy: 'Criado por Mateus Arce',
    catalogCrumb: 'catálogo', primaryNavigation: 'Navegação principal',
    discoverHeading: 'Descobrir ferramentas',
    discoverDescription: 'Catálogo de ferramentas para devs, mantido pela comunidade.',
    toolsCount: 'ferramentas', categoriesCount: 'categorias', categoriesLabel: 'Categorias',
    inCatalog: 'no catálogo', resultSingle: 'resultado', resultPlural: 'resultados',
    searchLabel: 'Buscar ferramentas', noResultsHeading: 'Nada encontrado',
    noResultsDescription: 'Tente outro termo ou categoria. Se a ferramenta não existe no catálogo, sugira para a comunidade.',
    catalogErrorHeading: 'Não foi possível carregar o catálogo',
    catalogErrorDescription: 'O catálogo está temporariamente indisponível.',
    suggestOne: 'Sugerir uma ferramenta', showing: 'Mostrando', of: 'de', loadMore: 'Carregar mais',
    viewCategory: 'Ver categoria completa:', contributePrompt: 'Sentiu falta de alguma ferramenta? Mande só o link — a revisão cuida do resto.',
    saveFavorite: 'Salvar {name} nos favoritos', removeFavorite: 'Remover {name} dos favoritos',
    visit: 'Visitar', footerDescription: 'devhub · ferramentas para devs, curadas pela comunidade',
    footerLinks: 'Links do rodapé', madeBy: 'feito por',
    myFavorites: 'Seus favoritos', savedTools: 'ferramentas salvas', savedToolSingle: 'ferramenta salva',
    favoriteEmptyHeading: 'Nenhum favorito aqui ainda',
    favoriteEmptyDescription: 'Toque no coração de uma ferramenta para salvá-la nesta lista.',
    skipContent: 'Pular para o conteúdo', discoverTools: 'Descubra ferramentas', searchTools: 'Busque ferramentas, categorias, tecnologias...', all: 'Todas', allTools: 'Todas as ferramentas', loadToolsError: 'Algo deu errado ao buscar as ferramentas.', retry: 'Tentar novamente', noResults: 'Nenhuma ferramenta corresponde à sua busca', noTools: 'Nenhuma ferramenta encontrada', trySearch: 'Tente outro termo de busca.',
  },
} as const

type MessageKey = keyof typeof messages.en
interface I18nValue { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string }
const I18nContext = createContext<I18nValue>({ locale: 'en', setLocale: () => undefined, t: key => messages.en[key] })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    // Resolved after hydration to avoid a server/client markup mismatch;
    // deferred so setState is not called synchronously in the effect body.
    queueMicrotask(() => {
      const saved = window.localStorage.getItem('devlist-locale')
      if (saved === 'en' || saved === 'pt-BR') {
        setLocaleState(saved)
        return
      }
      if (navigator.language.toLowerCase().startsWith('pt')) setLocaleState('pt-BR')
    })
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
