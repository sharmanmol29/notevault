import { BookOpen, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import type { Folder } from '../types'

import { FolderItem } from './FolderItem'

type Props = {
  folders: Folder[]
  activeFolderId?: number | null
  onSelectFolder: (id: number) => void
  onCreateFolder: () => void
  onRenameFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
}

export function Sidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: Props) {
  return (
    <aside className="flex h-full w-[300px] flex-col bg-[#0F172A] text-slate-100">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-accent-purple" />
          <div className="text-xl font-bold text-white">NoteVault</div>
        </div>
        <div className="mt-1 text-xs italic text-[#64748B]">Where your ideas stay truly yours.</div>
      </div>

      <nav className="px-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
              isActive ? 'bg-[#1E293B] text-white' : 'text-slate-200 hover:bg-white/5'
            }`
          }
        >
          <BookOpen className="h-4 w-4" />
          All Notes
        </NavLink>
        <NavLink
          to="/recycle-bin"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
              isActive ? 'bg-[#1E293B] text-white' : 'text-slate-200 hover:bg-white/5'
            }`
          }
        >
          <Trash2 className="h-4 w-4" />
          Recycle Bin
        </NavLink>
      </nav>

      <div className="mx-4 my-4 h-px bg-white/10" />

      <div className="flex items-center justify-between px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
        <span>Folders</span>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10"
          onClick={onCreateFolder}
          aria-label="Create folder"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-6">
        {folders.length === 0 ? (
          <div className="px-3 text-sm text-[#64748B]">No folders yet</div>
        ) : (
          folders.map((f) => (
            <FolderItem
              key={f.id}
              folder={f}
              activeFolderId={activeFolderId ?? undefined}
              onSelect={onSelectFolder}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
            />
          ))
        )}
      </div>
    </aside>
  )
}
