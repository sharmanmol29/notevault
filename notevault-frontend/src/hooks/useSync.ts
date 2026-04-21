import { useCallback, useEffect, useState } from 'react'

import { flushPendingOps, syncWithServer } from '../services/syncService'

type SyncStatus = 'synced' | 'syncing' | 'offline'

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline')

  const run = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    setStatus('syncing')
    try {
      await flushPendingOps()
      await syncWithServer()
      setStatus('synced')
    } catch {
      setStatus('offline')
    }
  }, [])

  useEffect(() => {
    void run()
  }, [run])

  useEffect(() => {
    const onOnline = () => void run()
    const onOffline = () => setStatus('offline')
    const onFocus = () => void run()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('focus', onFocus)
    }
  }, [run])

  return { status, syncNow: run }
}
