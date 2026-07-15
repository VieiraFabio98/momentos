import { api } from './api'

export interface IUserResponse {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export function registerUser(data: { name: string; email: string; password: string }) {
  return api.post<IUserResponse>('/users', data)
}

export function login(data: { email: string; password: string }) {
  return api.post<{ accessToken: string; user: IUserResponse }>('/auth/login', data)
}

export function googleLogin(idToken: string) {
  return api.post<{ accessToken: string; user: IUserResponse }>('/auth/google', { idToken })
}

export function getMe() {
  return api.get<IUserResponse>('/auth/me')
}

export function requestPasswordRecovery(email: string) {
  return api.post<void>('/auth/forgot-password', { email })
}
