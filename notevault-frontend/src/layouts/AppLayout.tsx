import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { Sidebar } from '../components/Sidebar'
import { TopNavbar } from '../components/TopNavbar'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import * as foldersApi from '../api/foldersApi'
import { useFolders } from '../hooks/useFolders'
import { useSync } from '../hooks/useSync'
import type { Folder } from '../types'
import { useFolderStore } from '../store/folderStore'

export type AppLayoutContext = {
  search: string
  setSearch: (v: string) => void
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const folders = useFolderStore((s) => s.folders)
  const { reload: reloadFolders } = useFolders()
  const { status } = useSync()

  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null)
  const [renameName, setRenameName] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null)

  const activeFolderId = (() => {
    const m = location.pathname.match(/^\/folder\/(\d+)/)
    return m ? Number(m[1]) : null
  })()

  const closeCreate = () => {
    setCreateOpen(false)
    setNewFolderName('')
  }

  const closeRename = () => {
    setRenameTarget(null)
    setRenameName('')
  }

  return (
    <div className="flex h-full min-h-0 bg-slate-50 dark:bg-slate-950">
      <Sidebar
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={(id) => navigate(`/folder/${id}`)}
        onCreateFolder={() => setCreateOpen(true)}
        onRenameFolder={(folder) => {
          setRenameTarget(folder)
          setRenameName(folder.name)
        }}
        onDeleteFolder={(folder) => setDeleteTarget(folder)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar search={search} onSearchChange={setSearch} syncStatus={status} />
        <main className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-950">
          <Outlet context={{ search, setSearch } satisfies AppLayoutContext} />
        </main>
      </div>

      <Modal open={createOpen} title="New folder" onClose={closeCreate}>
        <div className="space-y-3">
          <Input label="Name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await foldersApi.createFolder({ name: newFolderName.trim() || 'Untitled folder' })
                  await reloadFolders()
                  closeCreate()
                } catch {
                  toast.error('Could not create folder')
                }
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!renameTarget} title="Rename folder" onClose={closeRename}>
        <div className="space-y-3">
          <Input label="Name" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeRename}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!renameTarget) return
                try {
                  await foldersApi.updateFolder(renameTarget.id, { name: renameName.trim() || renameTarget.name })
                  await reloadFolders()
                  closeRename()
                } catch {
                  toast.error('Could not rename folder')
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} title="Delete folder" onClose={() => setDeleteTarget(null)}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will delete the folder and subfolders. Notes inside will be moved to the vault root.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!deleteTarget) return
              try {
                await foldersApi.deleteFolder(deleteTarget.id)
                await reloadFolders()
                if (activeFolderId === deleteTarget.id) navigate('/')
                setDeleteTarget(null)
              } catch {
                toast.error('Could not delete folder')
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
