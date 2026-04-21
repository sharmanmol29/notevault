import { useCallback, useEffect, useState } from 'react'

import * as foldersApi from '../api/foldersApi'
import { db } from '../services/db'
import type { Folder } from '../types'
import { useFolderStore } from '../store/folderStore'

function rebuildTree(flat: Folder[]): Folder[] {
  const map = new Map<number, Folder>()
  for (const f of flat) {
    map.set(f.id, { ...f, children: [] })
  }
  const roots: Folder[] = []
  for (const f of flat) {
    const node = map.get(f.id)!
    if (f.parentId == null) {
      roots.push(node)
    } else {
      const parent = map.get(f.parentId)
      parent?.children.push(node)
    }
  }
  roots.sort((a, b) => a.name.localeCompare(b.name))
  const sortChildren = (nodes: Folder[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    for (const n of nodes) sortChildren(n.children)
  }
  sortChildren(roots)
  return roots
}

export function useFolders() {
  const setFolders = useFolderStore((s) => s.setFolders)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (navigator.onLine) {
        const data = await foldersApi.getFolders()
        setFolders(data)
        const flat: Folder[] = []
        const walk = (nodes: Folder[]) => {
          for (const n of nodes) {
            flat.push({
              id: n.id,
              name: n.name,
              parentId: n.parentId,
              children: [],
              noteCount: n.noteCount,
              createdAt: n.createdAt,
            })
            walk(n.children)
          }
        }
        walk(data)
        await db.folders.clear()
        await db.folders.bulkPut(flat)
      } else {
        const local = await db.folders.toArray()
        setFolders(rebuildTree(local))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load folders'
      setError(message)
      const local = await db.folders.toArray()
      setFolders(rebuildTree(local))
    } finally {
      setLoading(false)
    }
  }, [setFolders])

  useEffect(() => {
    void load()
  }, [load])

  return { loading, error, reload: load }
}
