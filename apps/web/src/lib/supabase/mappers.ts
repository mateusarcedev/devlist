import type { Category, Favorite, Suggestion, Tool } from '@/types'
import { accessModelForTool } from '@/lib/tool-access'

export interface ToolRow {
  id: string
  name: string
  link: string
  description: string
  category_id: string
  access_model?: string | null
}

export interface FavoriteRow {
  id: string
  user_id: string
  tool_id: string
  tools?: ToolRow | ToolRow[] | null
}

export interface SuggestionRow {
  id: string
  user_id: string
  tool_id: string | null
  name: string
  link: string
  description: string
  category_id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export function toTool(row: ToolRow): Tool {
  return {
    id: row.id,
    name: row.name,
    link: row.link,
    description: row.description,
    categoryId: row.category_id,
    accessModel: accessModelForTool(row.access_model, row.link),
  }
}

export function toCategory(row: { id: string; name: string }): Category {
  return { id: row.id, name: row.name }
}

export function toFavorite(row: FavoriteRow): Favorite {
  const record = Array.isArray(row.tools) ? row.tools[0] : row.tools
  return {
    id: row.id,
    userId: row.user_id,
    toolId: row.tool_id,
    ...(record ? { tool: toTool(record) } : {}),
  }
}

export function toSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    userId: row.user_id,
    toolId: row.tool_id ?? '',
    status: row.status,
  }
}
