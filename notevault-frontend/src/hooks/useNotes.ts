import { useCallback, useEffect, useState } from 'react'

import * as notesApi from '../api/notesApi'
import { db } from '../services/db'
import { useNotesStore } from '../store/notesStore'

export function useNotes(folderId?: number | null) {
  const setNotes = useNotesStore((s) => s.setNotes)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (navigator.onLine) {
        const data = await notesApi.getAllNotes(folderId ?? undefined)
        setNotes(data)
        await db.notes.bulkPut(data)
      } else {
        const local = await db.notes.filter((n) => !n.deleted).toArray()
        const filtered =
          folderId == null
            ? local
            : local.filter((n) => (n.folderId ?? null) === folderId)
        setNotes(filtered.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load notes'
      setError(message)
      const local = await db.notes.filter((n) => !n.deleted).toArray()
      setNotes(local.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)))
    } finally {
      setLoading(false)
    }
  }, [folderId, setNotes])

  useEffect(() => {
    void load()
  }, [load])

  return { loading, error, reload: load }
}
