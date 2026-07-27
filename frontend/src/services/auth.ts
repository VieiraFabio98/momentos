import { api } from './api'

export interface IUserResponse {
  id: string
  name: string
  email: string
  // false em conta criada só pelo Google: não há senha atual para conferir
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export interface IUpdateUserData {
  name?: string
  email?: string
  password?: string
  // exigido pelo backend ao trocar senha ou e-mail de conta que já tem senha
  currentPassword?: string
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

export function updateUser(id: string, data: IUpdateUserData) {
  return api.patch<IUserResponse>(`/users/${id}`, data)
}
