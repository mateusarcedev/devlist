// web/src/types/index.ts

import type { AccessModel } from '@/lib/tool-access'

export interface Tool {
  id: string
  name: string
  link: string
  description: string
  categoryId: string
  accessModel?: AccessModel
  category?: Category
}

export interface Category {
  id: string
  name: string
}

export interface User {
  githubId: number
  name: string
  email: string
  avatar: string
  role: 'USER' | 'ADMIN'
}

export interface Favorite {
  id: string
  userId: string
  toolId: string
  tool?: Tool
}

export interface Suggestion {
  id: string
  userId: string
  toolId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  tool?: Tool
}

export type OnFavoriteChange = (toolId: string, isFavorite: boolean) => void

