import * as notesApi from '../api/notesApi'

import { db } from './db'

export async function syncWithServer() {
  const lastSync = await db.syncMeta.get('lastSync')
  const since = lastSync?.value || '1970-01-01T00:00:00Z'

  const response = await notesApi.syncNotes(since)

  await db.notes.bulkPut(response.updated)

  for (const id of response.deletedIds) {
    const existing = await db.notes.get(id)
    if (existing) {
      await db.notes.update(id, { ...existing, deleted: true })
    }
  }

  await db.syncMeta.put({ key: 'lastSync', value: response.serverTime })
}

export async function enqueuePendingOp(kind: 'create' | 'update', payload: unknown) {
  await db.pendingOps.add({
    kind,
    payload: JSON.stringify(payload),
    ts: Date.now(),
  })
}

export async function flushPendingOps() {
  if (!navigator.onLine) {
    return
  }
  const ops = await db.pendingOps.orderBy('id').toArray()
  for (const op of ops) {
    if (!op.id) continue
    const body = JSON.parse(op.payload) as {
      id?: number
      title?: string
      content?: string
      folderId?: number | null
      tags?: string[]
      moveToRoot?: boolean
    }
    if (op.kind === 'update' && body.id) {
      await notesApi.updateNote(body.id, {
        title: body.title,
        content: body.content,
        folderId: body.folderId,
        tags: body.tags,
        moveToRoot: body.moveToRoot,
      })
    } else if (op.kind === 'create') {
      await notesApi.createNote({
        title: body.title,
        content: body.content,
        folderId: body.folderId ?? undefined,
      })
    }
    await db.pendingOps.delete(op.id)
  }
}
