import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import * as authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'

export function OAuth2CallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const access = params.get('token')
      const refresh = params.get('refreshToken')
      if (!access || !refresh) {
        setError('Missing tokens')
        return
      }
      setAuth({ id: 0, name: '…', email: '…' }, access, refresh)
      try {
        const user = await authApi.getMe()
        setAuth(user, access, refresh)
        navigate('/', { replace: true })
      } catch {
        setError('Could not load profile')
      }
    }
    void run()
  }, [navigate, params, setAuth])

  return (
    <div className="flex min-h-full items-center justify-center bg-[#EEF2FF] px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
        <div className="text-sm font-semibold text-slate-800">Signing you in…</div>
        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
      </div>
    </div>
  )
}
