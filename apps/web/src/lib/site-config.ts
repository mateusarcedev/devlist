/** Public product identity; repository/workspace still use historical devlist identifier. */
export const siteName = 'DevHub'
export const siteTitle = 'DevHub — Curated developer tools'
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://devhub.mateusarce.dev').replace(/\/$/, '')
