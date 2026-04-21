import axios from 'axios'

import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch((err) => Promise.reject(err))
      }
      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const user = useAuthStore.getState().user
        if (!refreshToken || !user) {
          throw new Error('No refresh token')
        }
        const { data } = await axios.post<{
          accessToken: string
          refreshToken: string
        }>(`${baseURL}/api/auth/refresh`, { refreshToken })
        useAuthStore.getState().setAuth(user, data.accessToken, data.refreshToken)
        failedQueue.forEach((p) => p.resolve(data.accessToken))
        failedQueue = []
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (e) {
        failedQueue.forEach((p) => p.reject(e))
        failedQueue = []
        const status = axios.isAxiosError(e) ? e.response?.status : undefined
        // Only log out on definite auth failures. Network/server outages should keep local session.
        if (status === 401 || status === 403) {
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api
