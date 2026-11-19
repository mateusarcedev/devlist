import type { SeoContributor, SeoTool } from './data'
import { absoluteUrl, site } from './site'

type Node = Record<string, unknown>
const websiteId = `${site.url}/#website`
const personId = `${site.author.url}/#person`

function website(): Node {
  return {
    '@type': 'WebSite', '@id': websiteId, url: site.url,
    name: site.name, description: site.description, inLanguage: site.language,
    creator: { '@id': personId }, publisher: { '@id': personId },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

function items(tools: SeoTool[], limit=100) {
  return tools.slice(0,limit).map((tool,index) => ({
    '@type': 'ListItem', position: index+1, name: tool.name,
    url: tool.url, description: tool.description,
  }))
}

export function homeJsonLd(tools: SeoTool[]): Node {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      website(),
      {
        '@type': 'Person', '@id': personId, name: site.author.name,
        url: site.author.url, sameAs: [site.author.github],
      },
      {
        '@type': 'CollectionPage', '@id': `${site.url}/#catalog`,
        url: site.url, name: site.title, description: site.description,
        isPartOf: { '@id': websiteId }, inLanguage: site.language,
        mainEntity: {
          '@type': 'ItemList', numberOfItems: tools.length,
          itemListOrder: 'https://schema.org/ItemListOrderAscending',
          itemListElement: items(tools),
        },
      },
    ],
  }
}

export function categoryJsonLd(name: string, tools: SeoTool[]): Node {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage', name: `${name} · ${site.name}`,
    url: absoluteUrl('/tools/'+encodeURIComponent(name)),
    isPartOf: { '@id': websiteId },
    mainEntity: {
      '@type': 'ItemList', numberOfItems: tools.length,
      itemListElement: items(tools),
    },
  }
}

export function contributorsJsonLd(contributors: SeoContributor[]): Node {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage', name: `Contributors · ${site.name}`,
    url: absoluteUrl('/contributors'), isPartOf: { '@id': websiteId },
    mainEntity: {
      '@type': 'ItemList', numberOfItems: contributors.length,
      itemListElement: contributors.slice(0,100).map((c,index) => ({
        '@type': 'ListItem', position: index+1,
        item: {
          '@type': 'Person', name: c.login,
          url: `https://github.com/${encodeURIComponent(c.login)}`,
          ...(c.avatarUrl ? { image: c.avatarUrl } : {}),
        },
      })),
    },
  }
}
