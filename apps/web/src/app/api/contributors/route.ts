import { fetchPublicContributors, type ContributorSort } from '@/lib/public-contributors'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('sort') ?? 'approved'
  if (requested !== 'approved' && requested !== 'recent') {
    return NextResponse.json({ message: 'Invalid sort. Use approved or recent.' }, { status: 422 })
  }

  try {
    const contributors = await fetchPublicContributors(requested as ContributorSort)
    return NextResponse.json({ contributors }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ message: 'Contributors temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
