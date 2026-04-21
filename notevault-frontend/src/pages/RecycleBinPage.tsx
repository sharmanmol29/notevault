import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import * as recycleBinApi from '../api/recycleBinApi'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import type { Note } from '../types'

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function RecycleBinPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try {
      const data = await recycleBinApi.getDeleted()
      setNotes(data)
    } catch {
      toast.error('Failed to load recycle bin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">Recycle Bin</div>
          <div className="mt-1 text-sm text-slate-500">Deleted notes stay here until you remove them permanently.</div>
        </div>
        {notes.length ? (
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await recycleBinApi.emptyBin()
                await reload()
              } catch {
                toast.error('Could not empty recycle bin')
              }
            }}
          >
            Empty Recycle Bin
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
              <Skeleton className="mb-3 h-5 w-2/3" />
              <Skeleton className="mb-2 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon={<Trash2 className="h-7 w-7" />} title="Recycle bin is empty" subtitle="Nothing to restore yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-5 opacity-80">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{note.title}</div>
              <div className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {stripHtml(note.content ?? '').slice(0, 120)}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="bg-accent-green text-white hover:bg-green-600"
                  onClick={async () => {
                    try {
                      await recycleBinApi.restoreNote(note.id)
                      setNotes((n) => n.filter((x) => x.id !== note.id))
                    } catch {
                      toast.error('Could not restore note')
                    }
                  }}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    try {
                      await recycleBinApi.hardDelete(note.id)
                      setNotes((n) => n.filter((x) => x.id !== note.id))
                    } catch {
                      toast.error('Could not delete permanently')
                    }
                  }}
                >
                  Delete permanently
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
