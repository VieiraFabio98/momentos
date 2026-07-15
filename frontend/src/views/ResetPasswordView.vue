<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, api } from '../services/api'

const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const token = computed(() => String(route.query.token ?? ''))

async function handleSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não conferem'
    return
  }

  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: token.value, password: password.value })
    successMessage.value = 'Senha redefinida! Redirecionando para o login…'
    setTimeout(() => router.push({ name: 'login' }), 2000)
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Não foi possível conectar ao servidor'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-ivory-50 px-6 font-sans">
    <div class="w-full max-w-sm">
      <header class="mb-10 text-center">
        <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
        <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />
        <h2 class="font-display text-3xl font-medium text-stone-800">Nova senha</h2>
        <p class="mt-2 text-sm font-light text-stone-500">Escolha sua nova senha de acesso</p>
      </header>

      <p
        v-if="!token"
        class="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600"
      >
        Link inválido. Solicite uma nova recuperação de senha.
      </p>

      <form v-else class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label
            for="password"
            class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
          >
            Nova senha
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
          />
        </div>

        <div>
          <label
            for="confirm"
            class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
          >
            Confirmar senha
          </label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
          />
        </div>

        <p v-if="errorMessage" class="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
          {{ errorMessage }}
        </p>
        <p
          v-if="successMessage"
          class="rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
        >
          {{ successMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-champagne-500 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Aguarde…' : 'Redefinir senha' }}
        </button>
      </form>

      <footer class="mt-8 text-center text-sm text-stone-500">
        <RouterLink
          :to="{ name: 'login' }"
          class="font-medium text-champagne-600 hover:text-champagne-500"
        >
          Voltar para o login
        </RouterLink>
      </footer>
    </div>
  </main>
</template>
