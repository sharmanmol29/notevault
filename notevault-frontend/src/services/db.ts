import Dexie, { type Table } from 'dexie'

import type { Folder, Note } from '../types'

export interface PendingNoteOperation {
  id?: number
  kind: 'create' | 'update'
  payload: string
  ts: number
}

class NoteVaultDB extends Dexie {
  notes!: Table<Note>
  folders!: Table<Folder>
  syncMeta!: Table<{ key: string; value: string }>
  pendingOps!: Table<PendingNoteOperation>

  constructor() {
    super('NoteVaultDB')
    this.version(1).stores({
      notes: 'id, folderId, updatedAt, deleted',
      folders: 'id, parentId',
      syncMeta: 'key',
      pendingOps: '++id, ts',
    })
  }
}

export const db = new NoteVaultDB()
