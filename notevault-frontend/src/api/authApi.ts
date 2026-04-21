import type { AuthResponse, User } from '../types'

import api from './axiosInstance'

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
  return data
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/auth/register', { name, email, password })
  return data
}

export async function logout() {
  await api.post('/api/auth/logout')
}

export async function refreshToken(refreshTokenValue: string) {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
    refreshToken: refreshTokenValue,
  })
  return data
}

export async function getMe() {
  const { data } = await api.get<User>('/api/auth/me')
  return data
}
