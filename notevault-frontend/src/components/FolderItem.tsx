import { ChevronRight, Folder as FolderIcon, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import type { Folder } from '../types'

import { ContextMenu } from './ui/ContextMenu'

type Props = {
  folder: Folder
  depth?: number
  activeFolderId?: number | null
  onSelect: (id: number) => void
  onRename: (folder: Folder) => void
  onDelete: (folder: Folder) => void
}

export function FolderItem({ folder, depth = 0, activeFolderId, onSelect, onRename, onDelete }: Props) {
  const [open, setOpen] = useState(true)
  const isActive = activeFolderId === folder.id

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
          isActive ? 'bg-[#1E293B] text-white' : 'text-slate-200 hover:bg-white/5'
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center text-slate-400"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle folder"
        >
          <ChevronRight className={`h-4 w-4 transition ${open ? 'rotate-90' : ''}`} />
        </button>
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onSelect(folder.id)}>
          <FolderIcon className="h-4 w-4 text-accent-purple" />
          <span className="truncate">{folder.name}</span>
        </button>
        <ContextMenu
          trigger={
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 hover:bg-white/10 group-hover:opacity-100"
              aria-label="Folder actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            { label: 'Rename', onClick: () => onRename(folder) },
            { label: 'Delete', onClick: () => onDelete(folder), danger: true },
          ]}
        />
      </div>
      {open
        ? folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))
        : null}
    </div>
  )
}
