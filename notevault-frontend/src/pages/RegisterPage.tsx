import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import * as authApi from '../api/authApi'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  const emailOk = useMemo(() => /.+@.+\..+/.test(email), [email])

  return (
    <AuthLayout>
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow">
              <GoogleIcon />
            </div>
            <div className="text-2xl font-bold text-slate-900">NoteVault</div>
            <div className="mt-2 text-sm italic text-slate-500">Where your ideas stay truly yours.</div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 text-left">
              <div className="text-2xl font-bold text-slate-900">Create your vault</div>
              <div className="mt-1 text-sm text-slate-500">It only takes a minute</div>
            </div>

            <button
              type="button"
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              onClick={() => {
                window.location.href = `${apiBase}/oauth2/authorization/google`
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="mb-6 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              OR
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!name.trim()) {
                  toast.error('Name is required')
                  return
                }
                if (!emailOk) {
                  toast.error('Enter a valid email')
                  return
                }
                if (password.length < 8) {
                  toast.error('Password must be at least 8 characters')
                  return
                }
                if (password !== confirm) {
                  toast.error('Passwords do not match')
                  return
                }
                setLoading(true)
                try {
                  const data = await authApi.register(name.trim(), email.trim(), password)
                  setAuth(data.user, data.accessToken, data.refreshToken)
                  navigate('/')
                } catch (err) {
                  toast.error('Could not create account')
                } finally {
                  setLoading(false)
                }
              }}
            >
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <Input
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                passwordToggle
              />
              <Input
                label="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                passwordToggle
              />
              <Button type="submit" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link className="font-semibold text-accent-purple" to="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
