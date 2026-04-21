import type { Note, SyncResponse } from '../types'

import api from './axiosInstance'

export async function getAllNotes(folderId?: number | null) {
  const { data } = await api.get<Note[]>('/api/notes', {
    params: folderId != null ? { folderId } : undefined,
  })
  return data
}

export async function getNote(id: number) {
  const { data } = await api.get<Note>(`/api/notes/${id}`)
  return data
}

export async function createNote(payload: { title?: string; content?: string; folderId?: number | null }) {
  const { data } = await api.post<Note>('/api/notes', payload)
  return data
}

export async function updateNote(
  id: number,
  payload: { title?: string; content?: string; folderId?: number | null; tags?: string[]; moveToRoot?: boolean },
) {
  const { data } = await api.put<Note>(`/api/notes/${id}`, payload)
  return data
}

export async function deleteNote(id: number) {
  await api.delete(`/api/notes/${id}`)
}

export async function searchNotes(query: string) {
  const { data } = await api.get<Note[]>('/api/notes/search', { params: { q: query } })
  return data
}

export async function syncNotes(since: string) {
  const { data } = await api.get<SyncResponse>('/api/sync', { params: { since } })
  return data
}
