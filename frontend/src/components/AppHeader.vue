<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const firstName = computed(() => auth.user?.name.trim().split(/\s+/)[0] ?? '')

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-ivory-200 bg-white/60 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <RouterLink :to="{ name: 'dashboard' }">
        <h1 class="font-display text-2xl font-semibold text-stone-800">Momentos</h1>
      </RouterLink>
      <div class="flex items-center gap-4">
        <span v-if="auth.user" class="max-w-40 truncate text-sm text-stone-500">
          Olá, {{ firstName }}
        </span>
        <button
          class="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-champagne-400 hover:text-champagne-600"
          @click="handleLogout"
        >
          Sair
        </button>
      </div>
    </div>
  </header>
</template>
