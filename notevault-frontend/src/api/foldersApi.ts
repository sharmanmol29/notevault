import type { Folder } from '../types'

import api from './axiosInstance'

export async function getFolders() {
  const { data } = await api.get<Folder[]>('/api/folders')
  return data
}

export async function createFolder(payload: { name: string; parentId?: number | null }) {
  const { data } = await api.post<Folder>('/api/folders', payload)
  return data
}

export async function updateFolder(id: number, payload: { name: string }) {
  const { data } = await api.put<Folder>(`/api/folders/${id}`, payload)
  return data
}

export async function deleteFolder(id: number) {
  await api.delete(`/api/folders/${id}`)
}
