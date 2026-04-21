import { create } from 'zustand'

import type { Folder } from '../types'

interface FolderStore {
  folders: Folder[]
  setFolders: (folders: Folder[]) => void
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  setFolders: (folders) => set({ folders }),
}))
