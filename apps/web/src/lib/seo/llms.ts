import { getSeoTools, groupByCategory } from './data'
import { absoluteUrl, portuguese, site } from './site'

function clean(value: string): string {
  return value.replace(/\s+/g,' ').replace(/[\[\]<>]/g,'').trim()
}

export async function buildLlmsText(locale: 'en' | 'pt-BR' = 'en'): Promise<string> {
  const tools = await getSeoTools()
  const groups = groupByCategory(tools,locale)
  const pt = locale === 'pt-BR'
  const lines: string[] = [
    '# DevHub', '',
    '> '+(pt ? portuguese.description : site.description), '',
    `Site: ${site.url}`,
    pt ? `Ferramentas: ${tools.length} em ${groups.size} categorias.` : `Tools: ${tools.length} in ${groups.size} categories.`,
    pt ? 'Cada entrada inclui nome, link oficial e descrição do catálogo.' : 'Each entry includes its name, official URL and curated catalog description.',
    '', pt ? '## Páginas' : '## Pages', '',
    `- [${pt ? 'Descobrir ferramentas' : 'Discover tools'}](${absoluteUrl('/')})`,
    `- [${pt ? 'Contribuidores' : 'Contributors'}](${absoluteUrl('/contributors')})`,
    `- [GitHub](${site.repo})`,
    `- [${pt ? 'Versão em inglês' : 'Portuguese version'}](${absoluteUrl(pt ? '/llms.txt' : '/llms-pt.txt')})`,
    '',
  ]
  for (const [name,list] of groups) {
    lines.push(`## ${clean(name)}`,'')
    for (const tool of list) {
      // URL is constrained to http(s) by the database; prevent Markdown injection.
      lines.push(`- [${clean(tool.name)}](${encodeURI(tool.url).replace(/\\(/g,'%28').replace(/\\)/g,'%29')}) : ${clean(tool.description)}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
