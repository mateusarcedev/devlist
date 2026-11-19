import type { AccessModel } from '@/lib/tool-access'

export const MAX_COMPARISON_TOOLS = 3
export const MIN_COMPARISON_TOOLS = 2
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

export function parseComparisonIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < MIN_COMPARISON_TOOLS || value.length > MAX_COMPARISON_TOOLS)
    return null
  if (!value.every(id => typeof id === 'string' && uuid.test(id))) return null
  const ids = value as string[]
  return new Set(ids).size === ids.length ? ids : null
}

export interface ComparisonEvidence {
  en?: {
    useCases: string[]
    limitations: string[]
    pricingNote: string | null
  }
  useCases: string[]
  limitations: string[]
  pricingNote: string | null
  sourceUrl: string | null
  reviewedAt: string | null
}

/** Evidence copied conservatively from official vendor documentation (2026-11-19).
 * Not produced by the embedding model. Unknown products deliberately remain unknown.
 * Key on both name and hostname to avoid attaching evidence to unrelated catalog rows.
 * Prices and quotas vary over time: link to the vendor, never imply a fixed price. */
const evidence: Record<string, ComparisonEvidence> = {
  'coolify|coolify.io': {
    en: {
      useCases: ['Deploy applications and services on infrastructure you control', 'Manage self-hosted applications'],
      limitations: ['Self-hosting leaves server maintenance, updates and security under your responsibility'],
      pricingNote: 'Self-hosted Coolify has no license fee; servers and infrastructure still cost money.',
    },
    useCases: ['Deploy de aplicações e serviços em infraestrutura própria', 'Gerenciar instalações auto-hospedadas'],
    limitations: ['Na instalação própria, manutenção, atualizações e segurança do servidor ficam sob sua responsabilidade'],
    pricingNote: 'Coolify auto-hospedado sem taxa de licença; servidores e infraestrutura têm custos separados.',
    sourceUrl: 'https://coolify.io/docs/core/selfhosted-cloud-comparison',
    reviewedAt: '2026-11-19',
  },
  'canine|canine.sh': {
    en: {
      useCases: ['Deploy and manage applications using Kubernetes', 'Run a self-hosted deployment platform'],
      limitations: ['The self-hosted setup requires you to operate the underlying Kubernetes cluster/infrastructure'],
      pricingNote: 'The self-hosted edition is described as free; infrastructure and operations remain separate costs.',
    },
    useCases: ['Implantar e gerenciar aplicações sobre Kubernetes', 'Operar plataforma de deploy auto-hospedada'],
    limitations: ['É necessário operar a infraestrutura/cluster Kubernetes da implantação auto-hospedada'],
    pricingNote: 'Versão self-hosted anunciada como gratuita; infraestrutura e operação são custos à parte.',
    sourceUrl: 'https://canine.sh/self-hosted',
    reviewedAt: '2026-11-19',
  },
  'posthog|posthog.com': {
    en: {
      useCases: ['Analyze product usage and user behavior', 'Use session replay, feature flags and experiments'],
      limitations: ['Free tiers have per-product usage allowances; paid usage depends on enabled products and billing'],
      pricingNote: 'Recurring free tiers available; usage-based billing applies to paid allowances by product.',
    },
    useCases: ['Analisar uso e comportamento de produtos', 'Utilizar session replay, feature flags e experimentação'],
    limitations: ['O plano gratuito possui franquias de uso por produto; cobrança por uso depende do plano e dos produtos ativados'],
    pricingNote: 'Possui faixa gratuita recorrente; cobrança por uso em faixas pagas, conforme produto.',
    sourceUrl: 'https://posthog.com/pricing',
    reviewedAt: '2026-11-19',
  },
  'algolia|algolia.com': {
    en: {
      useCases: ['Add hosted search to applications', 'Integrate search and discovery APIs'],
      limitations: ['Free and paid plans have their own quotas and terms'],
      pricingNote: 'A Free plan is available; upper-tier charges and limits depend on contracted usage.',
    },
    useCases: ['Implementar busca hospedada em aplicações', 'Integrar APIs de pesquisa e descoberta'],
    limitations: ['O uso gratuito e os planos pagos estão sujeitos às respectivas cotas e condições'],
    pricingNote: 'Plano Free disponível; cobrança e limites dos planos superiores dependem do uso contratado.',
    sourceUrl: 'https://www.algolia.com/pricing',
    reviewedAt: '2026-11-19',
  },
  'medusa|medusajs.com': {
    en: {
      useCases: ['Build customizable ecommerce backends', 'Self-host headless commerce applications'],
      limitations: ['Self-hosting requires managing infrastructure', 'Enterprise Edition features may use different licensing from the open-source core'],
      pricingNote: 'Open-source core has no self-hosted license fee; Medusa Cloud is commercial.',
    },
    useCases: ['Construir backends de comércio eletrônico personalizáveis', 'Hospedar uma aplicação headless de e-commerce'],
    limitations: ['A instalação própria exige gerenciamento da infraestrutura', 'Recursos da Enterprise Edition podem ter licenciamento diferente do núcleo open source'],
    pricingNote: 'Núcleo open source sem licença para auto-hospedagem; Medusa Cloud é comercial.',
    sourceUrl: 'https://medusajs.com/kb/build-vs-buy/medusa-cloud-vs-self-hosting',
    reviewedAt: '2026-11-19',
  },
}

const UNKNOWN: ComparisonEvidence = {
  useCases: [], limitations: [], pricingNote: null, sourceUrl: null, reviewedAt: null,
}

export function getComparisonEvidence(name: string, link: string): ComparisonEvidence {
  try {
    const host = new URL(link).hostname.toLowerCase().replace(/^www\./, '')
    return evidence[name.trim().toLowerCase() + '|' + host] ?? UNKNOWN
  } catch { return UNKNOWN }
}

export interface ComparedTool {
  id: string
  name: string
  link: string
  description: string
  categoryName: string
  accessModel: AccessModel
  accessSourceUrl: string | null
  evidence: ComparisonEvidence
}
export interface SemanticPair {
  leftId: string
  rightId: string
  similarity: number
}
