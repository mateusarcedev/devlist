import { fetchGitHubCodeContributors } from '@/lib/github-code-contributors'
import { fetchPublicContributors, type ContributorSort } from '@/lib/public-contributors'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('sort') ?? 'approved'
  if (requested !== 'approved' && requested !== 'recent') {
    return NextResponse.json({ message: 'Invalid sort. Use approved or recent.' }, { status: 422 })
  }

  const [catalog, github] = await Promise.allSettled([
    fetchPublicContributors(requested as ContributorSort),
    fetchGitHubCodeContributors(),
  ])

  if (catalog.status === 'rejected' && github.status === 'rejected') {
    return NextResponse.json({ message: 'Contributors temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return NextResponse.json({
    contributors: catalog.status === 'fulfilled' ? catalog.value : [],
    codeContributors: github.status === 'fulfilled' ? github.value : [],
    sources: {
      catalog: catalog.status === 'fulfilled' ? 'ok' : 'unavailable',
      github: github.status === 'fulfilled' ? 'ok' : 'unavailable',
    },
  }, {
    headers: {
      'Cache-Control': catalog.status === 'fulfilled' && github.status === 'fulfilled'
        ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store',
    },
  })
}
