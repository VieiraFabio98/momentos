<script setup lang="ts">
import { useRoute } from 'vue-router'
import { getGuestName } from '../services/guest'

const route = useRoute()
const token = String(route.params.token ?? '')
const guestName = getGuestName()
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-stone-900 px-6 font-sans">
    <div class="max-w-md text-center">
      <h1 class="font-display text-3xl font-semibold text-ivory-50">
        {{ guestName ? `Pronto, ${guestName}!` : 'Câmera' }}
      </h1>
      <p class="mt-3 text-sm font-light text-stone-400">
        A câmera chega na próxima etapa (Task 5) — getUserMedia + upload direto pro álbum.
      </p>
      <p class="mt-8 text-xs text-stone-600">evento {{ token.slice(0, 8) }}…</p>
    </div>
  </main>
</template>
