import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-[#EEF2FF]">{children}</div>
}
