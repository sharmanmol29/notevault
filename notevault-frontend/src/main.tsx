import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

function applyThemeFromStorage() {
  try {
    const raw = localStorage.getItem('notevault-theme')
    if (!raw) {
      document.documentElement.classList.add('dark')
      return
    }
    const parsed = JSON.parse(raw) as { state?: { isDark?: boolean } }
    const isDark = parsed?.state?.isDark ?? true
    document.documentElement.classList.toggle('dark', isDark)
  } catch {
    document.documentElement.classList.add('dark')
  }
}

applyThemeFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
