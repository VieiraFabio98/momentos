import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getMe,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  type IUserResponse,
} from '../services/auth'

const TOKEN_KEY = 'momentos.token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<IUserResponse | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  function applySession(session: { accessToken: string; user: IUserResponse }) {
    token.value = session.accessToken
    user.value = session.user
    localStorage.setItem(TOKEN_KEY, session.accessToken)
  }

  async function login(email: string, password: string) {
    applySession(await loginRequest({ email, password }))
  }

  async function loginWithGoogle(idToken: string) {
    applySession(await googleLoginRequest(idToken))
  }

  async function fetchMe() {
    user.value = await getMe()
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, isAuthenticated, login, loginWithGoogle, fetchMe, logout }
})

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
