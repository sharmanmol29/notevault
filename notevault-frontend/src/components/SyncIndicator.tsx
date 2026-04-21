import { Loader2 } from 'lucide-react'

type Props = {
  status: 'synced' | 'syncing' | 'offline'
}

export function SyncIndicator({ status }: Props) {
  const label = status === 'synced' ? 'Synced' : status === 'syncing' ? 'Syncing' : 'Offline'
  const dot =
    status === 'synced' ? 'bg-emerald-500' : status === 'syncing' ? 'bg-amber-500' : 'bg-slate-400'

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {status === 'syncing' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" /> : <span className={`h-2 w-2 rounded-full ${dot}`} />}
      <span>{label}</span>
    </div>
  )
}
