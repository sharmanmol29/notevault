import { formatDistanceToNow } from 'date-fns'
import { FileText, MoreHorizontal } from 'lucide-react'

import type { Note } from '../types'

import { Card } from './ui/Card'
import { ContextMenu } from './ui/ContextMenu'

type Props = {
  note: Note
  onOpen: () => void
  onDelete: () => void
  onMove: () => void
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function NoteCard({ note, onOpen, onDelete, onMove }: Props) {
  const preview = stripHtml(note.content ?? '').slice(0, 100)

  return (
    <div className="relative">
      <Card onClick={onOpen} className="p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-accent-purple">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-left pr-8">
            <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{note.title}</div>
            <div className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{preview}</div>
            <div className="mt-3 text-xs text-slate-500">
              Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      </Card>

      <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
        <ContextMenu
          trigger={
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Note actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            { label: 'Move to folder', onClick: onMove },
            { label: 'Delete', onClick: onDelete, danger: true },
          ]}
        />
      </div>
    </div>
  )
}
