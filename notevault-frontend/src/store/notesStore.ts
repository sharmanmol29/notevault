import { create } from 'zustand'

import type { Note } from '../types'

interface NotesStore {
  notes: Note[]
  activeNoteId: number | null
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (note: Note) => void
  removeNote: (id: number) => void
  setActiveNote: (id: number | null) => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  activeNoteId: null,
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (note) => set((s) => ({ notes: s.notes.map((n) => (n.id === note.id ? note : n)) })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  setActiveNote: (id) => set({ activeNoteId: id }),
}))
