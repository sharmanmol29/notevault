import type { InputHTMLAttributes } from 'react'
import { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
  passwordToggle?: boolean
}

export function Input({ label, error, helperText, passwordToggle, type, className = '', ...rest }: Props) {
  const [show, setShow] = useState(false)
  const inputType = passwordToggle ? (show ? 'text' : 'password') : type

  return (
    <label className="block w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200">
      {label ? <span className="mb-1 block">{label}</span> : null}
      <div className="relative">
        <input
          className={`w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none ring-accent-purple/30 transition focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
            error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
          } ${className}`}
          type={inputType}
          {...rest}
        />
        {passwordToggle ? (
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {!error && helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
    </label>
  )
}
