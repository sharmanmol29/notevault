import type { AiResponse } from '../types'

import api from './axiosInstance'

export async function summarize(noteId: number) {
  const { data } = await api.post<AiResponse>('/api/ai/summarize', { noteId })
  return data
}

export async function generateTags(noteId: number) {
  const { data } = await api.post<AiResponse>('/api/ai/generate-tags', { noteId })
  return data
}

export async function improveNote(noteId: number) {
  const { data } = await api.post<AiResponse>('/api/ai/improve', { noteId })
  return data
}

export async function askNotes(question: string, noteIds: number[]) {
  const { data } = await api.post<AiResponse>('/api/ai/ask', { question, noteIds })
  return data
}
