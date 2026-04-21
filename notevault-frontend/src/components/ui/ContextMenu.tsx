import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type Item = {
  label: string
  onClick: () => void
  danger?: boolean
}

type Props = {
  trigger: ReactNode
  items: Item[]
}

export function ContextMenu({ trigger, items }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onContextMenu={(e) => {
        e.preventDefault()
        setPos({ x: e.clientX, y: e.clientY })
        setOpen(true)
      }}
    >
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open ? (
        <div
          className="fixed z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          style={{ top: pos.y, left: pos.x }}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                it.danger ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'
              }`}
              onClick={() => {
                it.onClick()
                setOpen(false)
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
