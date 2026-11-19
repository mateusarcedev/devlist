import { createClient } from '@/lib/supabase/server'
import { toTool, type ToolRow } from '@/lib/supabase/mappers'
import type { Tool } from '@/types'

type Db = Awaited<ReturnType<typeof createClient>>
const baseColumns = 'id,name,link,description,category_id'

/** Preview-safe: old schema remains readable until the migration lands on main.
 * After migration the database field is authoritative and paid-only tools are hidden. */
export async function loadVisibleTools(db: Db, categoryId?: string): Promise<{tools: Tool[]; error: boolean}> {
  const read = (withAccess: boolean) => {
    let query = db.from('tools').select(baseColumns + (withAccess ? ',access_model' : '')).order('name')
    if (categoryId) query = query.eq('category_id', categoryId)
    if (withAccess) query = query.neq('access_model', 'PAID')
    return query
  }

  let result = await read(true)
  if (result.error && /access_model/i.test(result.error.message)) {
    result = await read(false)
  }
  if (result.error) return { tools: [], error: true }
  return {
    tools: ((result.data ?? []) as unknown as ToolRow[]).map(toTool).filter(tool => tool.accessModel !== 'PAID'),
    error: false,
  }
}
