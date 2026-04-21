import { LogOut, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'

import { ThemeToggle } from './ui/ThemeToggle'
import { SyncIndicator } from './SyncIndicator'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  syncStatus: 'synced' | 'syncing' | 'offline'
}

export function TopNavbar({ search, onSearchChange, syncStatus }: Props) {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const initial = useMemo(() => (user?.name?.trim()?.[0] ?? '?').toUpperCase(), [user?.name])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex-1" />
      <div className="relative w-full max-w-[600px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none ring-accent-purple/30 focus:ring-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Search your vault…"
        />
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <SyncIndicator status={syncStatus} />
        <ThemeToggle />
        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-purple text-sm font-bold text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Account menu"
          >
            {initial}
          </button>
          {open ? (
            <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="px-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</div>
                <div className="mt-1 text-xs text-slate-500">{user?.email}</div>
              </div>
              <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={async () => {
                  try {
                    await authApi.logout()
                  } catch {
                    // ignore
                  }
                  clearAuth()
                  navigate('/login')
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
