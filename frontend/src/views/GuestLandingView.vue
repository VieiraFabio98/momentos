<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/api'
import { getGuestEvent, getGuestName, saveGuestName, type IGuestEvent } from '../services/guest'

const route = useRoute()
const router = useRouter()
const token = String(route.params.token ?? '')

const loading = ref(true)
const invalid = ref(false)
const event = ref<IGuestEvent | null>(null)
const guestName = ref(getGuestName())

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function handleStart() {
  if (guestName.value.trim()) {
    saveGuestName(guestName.value.trim())
  }
  router.push({ name: 'guest-camera', params: { token } })
}

onMounted(async () => {
  try {
    event.value = await getGuestEvent(token)
  } catch (error) {
    invalid.value = error instanceof ApiError
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-ivory-50 px-6 py-12 font-sans">
    <p v-if="loading" class="text-stone-400">Carregando…</p>

    <!-- token inválido -->
    <div v-else-if="invalid || !event" class="max-w-md text-center">
      <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
      <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />
      <h2 class="font-display text-2xl font-medium text-stone-800">Convite não encontrado</h2>
      <p class="mt-3 text-sm font-light text-stone-500">
        Este link não é válido. Confira o QR Code com os noivos e tente escanear novamente.
      </p>
    </div>

    <!-- evento encerrado -->
    <div v-else-if="event.status === 'expired'" class="max-w-md text-center">
      <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
      <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />
      <h2 class="font-display text-2xl font-medium text-stone-800">Este álbum já foi fechado</h2>
      <p class="mt-3 text-sm font-light text-stone-500">
        O período de fotos de “{{ event.title }}” terminou. Obrigado por fazer parte desse dia!
      </p>
    </div>

    <!-- convite válido -->
    <div v-else class="w-full max-w-md text-center">
      <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
      <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />

      <p class="text-xs font-medium uppercase tracking-widest text-champagne-600">
        Você foi convidado
      </p>
      <h2 class="mt-2 font-display text-3xl font-medium text-stone-800">{{ event.title }}</h2>
      <p class="mt-2 text-sm font-light text-stone-500">
        {{ formatDate(event.eventDate) }} · {{ event.location }}
      </p>

      <div class="mt-10 space-y-4 text-left">
        <div class="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <span class="font-display text-2xl text-champagne-500">1</span>
          <p class="text-sm text-stone-600">
            Seu celular vira uma <strong>câmera descartável</strong> — sem instalar nada, sem criar
            conta
          </p>
        </div>
        <div class="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <span class="font-display text-2xl text-champagne-500">2</span>
          <p class="text-sm text-stone-600">
            Fotografe a festa <strong>do seu jeito</strong>: os abraços, a pista, os detalhes que
            só você viu
          </p>
        </div>
        <div class="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <span class="font-display text-2xl text-champagne-500">3</span>
          <p class="text-sm text-stone-600">
            Depois da festa, os noivos recebem <strong>todos os momentos</strong> num álbum
            coletivo
          </p>
        </div>
      </div>

      <div class="mt-10">
        <label for="guest-name" class="mb-1.5 block text-left text-xs font-medium tracking-wide text-stone-600">
          Seu primeiro nome <span class="font-light text-stone-400">(opcional)</span>
        </label>
        <input
          id="guest-name"
          v-model="guestName"
          type="text"
          placeholder="Como os noivos te conhecem?"
          class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
        />
      </div>

      <button
        type="button"
        class="mt-6 w-full rounded-lg bg-champagne-500 py-3.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
        @click="handleStart"
      >
        Começar a fotografar 📸
      </button>
    </div>
  </main>
</template>
