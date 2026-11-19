import CardsContributors from '@/components/CardsContributors'
import { fetchPublicContributors } from '@/lib/public-contributors'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contribuidores',
  description: 'Pessoas que ajudaram a montar o catálogo DevHub por meio de sugestões aprovadas.',
  alternates: { canonical: '/contributors' },
}

// Rank data is derived from approved suggestions and changes after moderation.
export const dynamic = 'force-dynamic'

export default async function ContributorsPage() {
  let contributors: Awaited<ReturnType<typeof fetchPublicContributors>> = []
  let loadError = false
  try {
    contributors = await fetchPublicContributors('approved')
  } catch {
    loadError = true
  }
  return <CardsContributors data={contributors} loadError={loadError} />
}
