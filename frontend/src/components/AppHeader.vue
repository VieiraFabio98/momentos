<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const firstName = computed(() => auth.user?.name.trim().split(/\s+/)[0] ?? '')

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function goProfile() {
  close()
  router.push({ name: 'profile' })
}

function handleLogout() {
  close()
  auth.logout()
  router.push({ name: 'login' })
}

// fecha ao clicar fora do menu
function onClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-ivory-200 bg-white/60 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <RouterLink :to="{ name: 'dashboard' }">
        <h1 class="font-display text-2xl font-semibold text-stone-800">Momentos</h1>
      </RouterLink>

      <div v-if="auth.user" ref="menuRef" class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-champagne-400 hover:text-champagne-600"
          :aria-expanded="open"
          @click.stop="toggle"
        >
          <span class="max-w-32 truncate">Olá, {{ firstName }}</span>
          <svg
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-180': open }"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="-translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="-translate-y-1 opacity-0"
        >
          <div
            v-if="open"
            class="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg shadow-stone-200/50"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-stone-600 transition hover:bg-ivory-50 hover:text-champagne-600"
              @click="goProfile"
            >
              Perfil
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-stone-600 transition hover:bg-ivory-50 hover:text-champagne-600"
              @click="handleLogout"
            >
              Sair
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>
