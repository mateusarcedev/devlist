import CardsContributors from '@/components/CardsContributors'
import { fetchGitHubCodeContributors } from '@/lib/github-code-contributors'
import { fetchPublicContributors } from '@/lib/public-contributors'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contribuidores',
  description: 'Quem contribuiu com código no GitHub e com ferramentas aprovadas no DevHub.',
  alternates: { canonical: '/contributors' },
}

export const dynamic = 'force-dynamic'

export default async function ContributorsPage() {
  // Independent sources: absent catalog migration must not hide GitHub contributors.
  const [approved, code] = await Promise.allSettled([
    fetchPublicContributors('approved'),
    fetchGitHubCodeContributors(),
  ])

  return (
    <CardsContributors
      data={approved.status === 'fulfilled' ? approved.value : []}
      loadError={approved.status === 'rejected'}
      codeContributors={code.status === 'fulfilled' ? code.value : []}
      codeLoadError={code.status === 'rejected'}
    />
  )
}
