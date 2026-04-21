export interface User {
  id: number
  name: string
  email: string
}

export interface Note {
  id: number
  title: string
  content: string
  folderId: number | null
  folderName: string | null
  tags: string[]
  wordCount: number
  createdAt: string
  updatedAt: string
  deleted: boolean
}

export interface Folder {
  id: number
  name: string
  parentId: number | null
  children: Folder[]
  noteCount: number
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface SyncResponse {
  updated: Note[]
  deletedIds: number[]
  serverTime: string
}

export interface AiResponse {
  text?: string
  tags?: string[]
}
