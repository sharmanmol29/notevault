import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import * as notesApi from '../api/notesApi'
import { NoteCard } from '../components/NoteCard'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { useDebounce } from '../hooks/useDebounce'
import type { AppLayoutContext } from '../layouts/AppLayout'
import type { Note } from '../types'
import { useFolderStore } from '../store/folderStore'
import { useNotesStore } from '../store/notesStore'
import { FileText } from 'lucide-react'

function flattenFolders(nodes: import('../types').Folder[]): import('../types').Folder[] {
  const out: import('../types').Folder[] = []
  const walk = (ns: import('../types').Folder[]) => {
    for (const n of ns) {
      out.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return out
}

export function NotesPage() {
  const { search } = useOutletContext<AppLayoutContext>()
  const navigate = useNavigate()
  const params = useParams()
  const folderId = params.folderId ? Number(params.folderId) : null

  const notes = useNotesStore((s) => s.notes)
  const setNotes = useNotesStore((s) => s.setNotes)
  const folders = useFolderStore((s) => s.folders)

  const [loading, setLoading] = useState(true)
  const [moveNote, setMoveNote] = useState<Note | null>(null)
  const [moveFolderId, setMoveFolderId] = useState<number | 'root'>('root')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        if (!navigator.onLine) {
          toast.error('Offline: showing cached notes where available')
        }
        if (debouncedSearch.trim()) {
          const data = await notesApi.searchNotes(debouncedSearch.trim())
          setNotes(data)
        } else {
          const data = await notesApi.getAllNotes(folderId ?? undefined)
          setNotes(data)
        }
      } catch {
        toast.error('Failed to load notes')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [debouncedSearch, folderId, setNotes])

  const title = folderId == null ? 'All Notes' : 'Folder'
  const subtitle = folderId == null ? 'Everything in your vault' : 'Notes in this folder'

  const flatFolders = useMemo(() => flattenFolders(folders), [folders])

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        </div>
        <Button
          onClick={async () => {
            try {
              const note = await notesApi.createNote({ title: 'Untitled', content: '', folderId: folderId ?? undefined })
              navigate(`/notes/${note.id}`)
            } catch {
              toast.error('Could not create note')
            }
          }}
        >
          + New note
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
              <Skeleton className="mb-3 h-5 w-2/3" />
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="No notes here yet"
          subtitle="Start capturing your ideas. Your vault is private and yours alone."
          actionLabel="Create your first note"
          onAction={async () => {
            try {
              const note = await notesApi.createNote({ title: 'Untitled', content: '', folderId: folderId ?? undefined })
              navigate(`/notes/${note.id}`)
            } catch {
              toast.error('Could not create note')
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={() => navigate(`/notes/${note.id}`)}
              onDelete={async () => {
                try {
                  await notesApi.deleteNote(note.id)
                  setNotes(notes.filter((n) => n.id !== note.id))
                } catch {
                  toast.error('Could not delete note')
                }
              }}
              onMove={() => {
                setMoveNote(note)
                setMoveFolderId(note.folderId ?? 'root')
              }}
            />
          ))}
        </div>
      )}

      <Modal open={!!moveNote} title="Move to folder" onClose={() => setMoveNote(null)}>
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            value={moveFolderId === 'root' ? 'root' : String(moveFolderId)}
            onChange={(e) => {
              const v = e.target.value
              setMoveFolderId(v === 'root' ? 'root' : Number(v))
            }}
          >
            <option value="root">Vault root</option>
            {flatFolders.map((f) => (
              <option key={f.id} value={String(f.id)}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMoveNote(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!moveNote) return
                try {
                  const updated =
                    moveFolderId === 'root'
                      ? await notesApi.updateNote(moveNote.id, { moveToRoot: true })
                      : await notesApi.updateNote(moveNote.id, { folderId: Number(moveFolderId) })
                  setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
                  setMoveNote(null)
                } catch {
                  toast.error('Could not move note')
                }
              }}
            >
              Move
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
