import { siteName, siteTitle, siteUrl } from '@/lib/site-config'

/** Canonical identity remains English until the site has distinct localized URLs. */
export const site = {
  name: siteName,
  url: siteUrl,
  title: siteTitle,
  description: 'A community-curated catalog of developer tools, open-source projects, free resources and freemium products for software development.',
  locale: 'en_US',
  language: 'en',
  repo: 'https://github.com/mateusarcedev/devlist',
  author: {
    name: 'Mateus Arce',
    url: 'https://mateusarce.dev',
    github: 'https://github.com/mateusarcedev',
  },
  themeColor: { dark: '#151515', light: '#f5f3ee' },
} as const

export const portuguese = {
  title: 'DevHub — ferramentas para devs, curadas pela comunidade',
  description: 'Catálogo de ferramentas para desenvolvedores: open source, gratuitas e freemium. UI kits, APIs, bancos de dados, DevOps, animação e mais.',
  language: 'pt-BR',
} as const

export function absoluteUrl(path = '/'): string {
  return new URL(path, site.url + '/').toString()
}
