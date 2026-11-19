'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/browser'

/** Reuses the exact query key/cache of the tool cards, avoiding N+1 requests. */
export default function FavoriteNavCount({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['favorite-tool-ids', userId],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await createClient()
        .from('favorites')
        .select('tool_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map(item => item.tool_id)
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  if (!data?.length) return null
  return <span className='text-[11px] text-accent' aria-label={data.length + ' favoritos'}>{data.length}</span>
}
