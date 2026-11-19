/** Canonical URL handling for the URL-only suggestion flow.
 * Validation is repeated in Postgres so bypassing Next.js cannot bypass guards. */
export class SuggestionUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SuggestionUrlError'
  }
}

export interface NormalizedSuggestionUrl {
  url: string
  host: string
}

export function normalizeSuggestionUrl(raw: string): NormalizedSuggestionUrl {
  const value = raw.trim()
  if (!value) throw new SuggestionUrlError('Cole o link da ferramenta.')
  if (value.length > 2048 || /\s/.test(value)) {
    throw new SuggestionUrlError('Esse link não parece válido. Ex.: https://exemplo.com')
  }
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value) && !/^https?:\/\//i.test(value)) {
    throw new SuggestionUrlError('Esse link não parece válido. Ex.: https://exemplo.com')
  }
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value)
  } catch {
    throw new SuggestionUrlError('Esse link não parece válido. Ex.: https://exemplo.com')
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  const labels = host.split('.')
  if (
    !['https:', 'http:'].includes(parsed.protocol) ||
    parsed.username || parsed.password || parsed.port ||
    labels.length < 2 || host.length > 253 ||
    !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ||
    labels.some(part => part.length > 63 || part.startsWith('-') || part.endsWith('-')) ||
    /^\d+$/.test(labels.at(-1) ?? '')
  ) {
    throw new SuggestionUrlError('Esse link não parece válido. Ex.: https://exemplo.com')
  }
  // GitHub repository identity ignores www and the protocol, but retains the full path.
  if (host === 'github.com') {
    parsed.hostname = host
    parsed.protocol = 'https:'
  }
  parsed.hash = ''
  if (parsed.href.length > 2048) {
    throw new SuggestionUrlError('Esse link não parece válido. Ex.: https://exemplo.com')
  }
  return { url: parsed.href, host }
}
