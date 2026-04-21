import type { Note } from '../types'

import api from './axiosInstance'

export async function getDeleted() {
  const { data } = await api.get<Note[]>('/api/recycle-bin')
  return data
}

export async function restoreNote(id: number) {
  const { data } = await api.put<Note>(`/api/recycle-bin/${id}/restore`)
  return data
}

export async function hardDelete(id: number) {
  await api.delete(`/api/recycle-bin/${id}`)
}

export async function emptyBin() {
  await api.delete('/api/recycle-bin/empty')
}
