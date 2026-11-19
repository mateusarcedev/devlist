import { createClient } from '@/lib/supabase/browser'
import { toCategory, toSuggestion, toTool, type SuggestionRow, type ToolRow } from '@/lib/supabase/mappers'

type Response<T> = { data: T }
type Params = { params?: Record<string, unknown> }

function fail(message: string): never {
  const error = new Error(message) as Error & { response?: { data: { message: string } } }
  error.response = { data: { message } }
  throw error
}

async function currentUserId(): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return fail('Sign in to continue.')
  return data.user.id
}

// A compatibility adapter for the UI's existing get/post calls.
// The old NestJS API is no longer invoked; Supabase enforces all permissions with RLS.
const AxiosConfig = {
  async get<T>(path: string, options?: Params): Promise<Response<T>> {
    const supabase = createClient()

    if (path === '/categories') {
      const { data, error } = await supabase.from('categories').select('id,name').order('name')
      if (error) return fail(error.message)
      return { data: (data ?? []).map(toCategory) as T }
    }
    if (path === '/favorites/check') {
      const id = await currentUserId()
      const toolId = String(options?.params?.toolId ?? '')
      const { data, error } = await supabase.from('favorites')
        .select('id')
        .eq('user_id', id)
        .eq('tool_id', toolId)
        .maybeSingle()
      if (error) return fail(error.message)
      return { data: { isFavorite: Boolean(data) } as T }
    }
    if (path === '/tools') {
      const { data, error } = await supabase.from('tools')
        .select('id,name,link,description,category_id').order('name')
      if (error) return fail(error.message)
      return { data: ((data ?? []) as ToolRow[]).map(toTool) as T }
    }
    return fail('Unsupported client request: ' + path)
  },

  async post<T = unknown>(path: string, payload?: unknown): Promise<Response<T>> {
    const supabase = createClient()
    if (path === '/auth/logout') {
      const { error } = await supabase.auth.signOut()
      if (error) return fail(error.message)
      return { data: undefined as T }
    }

    if (path === '/favorites/toggle') {
      const id = await currentUserId()
      const body = payload as { toolId: string }
      const { data: current, error: checkError } = await supabase.from('favorites')
        .select('id').eq('user_id', id).eq('tool_id', body.toolId).maybeSingle()
      if (checkError) return fail(checkError.message)

      if (current) {
        const { error } = await supabase.from('favorites').delete()
          .eq('id', current.id).eq('user_id', id)
        if (error) return fail(error.message)
        return { data: { isFavorite: false } as T }
      }
      const { error } = await supabase.from('favorites')
        .insert({ user_id: id, tool_id: body.toolId })
      if (error) return fail(error.message)
      return { data: { isFavorite: true } as T }
    }

    if (path === '/suggestions') {
      const id = await currentUserId()
      const body = payload as { name: string; link: string; description: string; categoryId: string }
      const { data, error } = await supabase.from('suggestions')
        .insert({
          user_id: id,
          name: body.name.trim(),
          link: body.link.trim(),
          description: body.description.trim(),
          category_id: body.categoryId,
          status: 'PENDING',
        })
        .select('id,user_id,tool_id,name,link,description,category_id,status')
        .single()
      if (error || !data) return fail(error?.message ?? 'Unable to submit suggestion.')
      return { data: toSuggestion(data as SuggestionRow) as T }
    }

    if (path === '/tools') {
      const body = payload as { name: string; link: string; description: string; categoryId: string }
      const { data, error } = await supabase.from('tools')
        .insert({
          name: body.name.trim(),
          link: body.link.trim(),
          description: body.description.trim(),
          category_id: body.categoryId,
        })
        .select('id,name,link,description,category_id')
        .single()
      if (error || !data) return fail(error?.message ?? 'Unable to create tool.')
      return { data: toTool(data as ToolRow) as T }
    }

    return fail('Unsupported client request: ' + path)
  },
}

export default AxiosConfig
