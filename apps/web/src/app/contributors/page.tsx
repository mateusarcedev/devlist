import CardsContributors from '@/components/CardsContributors'
import { fetchGitHubCodeContributors } from '@/lib/github-code-contributors'
import { ContributorSchemaPendingError, fetchPublicContributors } from '@/lib/public-contributors'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { contributorsJsonLd } from '@/lib/seo/jsonld'

export const metadata: Metadata = pageMetadata({
  title: 'Contributors',
  description: 'People contributing code and recommending tools to the DevHub community catalog.',
  path: '/contributors',
})

export const dynamic = 'force-dynamic'

export default async function ContributorsPage() {
  // Independent sources: absent catalog migration must not hide GitHub contributors.
  const [approved, code] = await Promise.allSettled([
    fetchPublicContributors('approved'),
    fetchGitHubCodeContributors(),
  ])

  const contributors = approved.status === 'fulfilled' ? approved.value : []
  return (
    <>
      {contributors.length > 0 && <JsonLd data={contributorsJsonLd(contributors)} />}
      <CardsContributors
      data={contributors}
      loadError={approved.status === 'rejected'}
      catalogPending={approved.status === 'rejected' && approved.reason instanceof ContributorSchemaPendingError}
      codeContributors={code.status === 'fulfilled' ? code.value : []}
      codeLoadError={code.status === 'rejected'}
      />
    </>
  )
}
