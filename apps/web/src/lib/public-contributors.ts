import { createClient } from '@supabase/supabase-js'

export type ContributorSort = 'approved' | 'recent'

export interface PublicContributor {
  login: string
  avatarUrl: string
  isMaintainer: boolean
  approvedCount: number
  sinceYear: number
  lastApprovedAt: string
  recentTools: string[]
}

interface ContributorRow {
  github_login: string
  avatar_url: string
  is_maintainer: boolean
  approved_count: number
  since_year: number
  last_approved_at: string
  recent_tools: string[]
}

const fields = 'github_login,avatar_url,is_maintainer,approved_count,since_year,last_approved_at,recent_tools'

/**
 * Uses the publishable key with ANON privileges, not a service role.
 * The public read model exposes only approved credits; no email or user UUID.
 */
export async function fetchPublicContributors(sort: ContributorSort = 'approved'): Promise<PublicContributor[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const query = db.from('contributor_stats').select(fields)
  const { data, error } = sort === 'recent'
    ? await query.order('last_approved_at', { ascending: false })
      .order('approved_count', { ascending: false }).limit(200)
    : await query.order('approved_count', { ascending: false })
      .order('last_approved_at', { ascending: false }).limit(200)

  if (error) throw new Error('Unable to load public contributors')

  return ((data ?? []) as ContributorRow[]).map(row => ({
    login: row.github_login,
    avatarUrl: row.avatar_url,
    isMaintainer: row.is_maintainer,
    approvedCount: row.approved_count,
    sinceYear: row.since_year,
    lastApprovedAt: row.last_approved_at,
    recentTools: row.recent_tools ?? [],
  }))
}
