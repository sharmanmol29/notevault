import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ children, className = '', onClick, ...rest }: Props) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900 ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      {...rest}
    >
      {children}
    </div>
  )
}
