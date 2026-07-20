<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../services/api'
import {
  getGuestEvent,
  getGuestName,
  hasConsented,
  saveConsent,
  saveGuestName,
  type IGuestEvent,
} from '../services/guest'

const route = useRoute()
const router = useRouter()
const token = String(route.params.token ?? '')

const loading = ref(true)
const invalid = ref(false)
const event = ref<IGuestEvent | null>(null)
const guestName = ref(getGuestName())
const consent = ref(hasConsented())

const steps = [
  {
    number: '1',
    html: 'Seu celular vira uma <strong>câmera instantânea</strong>, sem instalar nada, sem criar conta',
  },
  {
    number: '2',
    html: 'Fotografe a festa <strong>do seu jeito</strong>: os abraços, a pista, os detalhes que só você viu',
  },
  {
    number: '3',
    html: 'Depois da festa, os noivos recebem <strong>todos os momentos</strong> num álbum coletivo',
  },
]

const step = ref(0)

function nextStep() {
  step.value += 1
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handleStart() {
  if (!consent.value) return

  if (guestName.value.trim()) {
    saveGuestName(guestName.value.trim())
  }
  saveConsent()
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
    <div v-else-if="event.windowState === 'closed'" class="max-w-md text-center">
      <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
      <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />
      <h2 class="font-display text-2xl font-medium text-stone-800">Este álbum já foi fechado</h2>
      <p class="mt-3 text-sm font-light text-stone-500">
        O período de fotos de “{{ event.title }}” terminou. Obrigado por fazer parte desse dia!
      </p>
    </div>

    <!-- álbum ainda não liberado -->
    <div v-else-if="event.windowState === 'upcoming'" class="max-w-md text-center">
      <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
      <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />
      <h2 class="font-display text-2xl font-medium text-stone-800">Quase lá! 💫</h2>
      <p class="mt-3 text-sm font-light text-stone-500">
        O álbum de “{{ event.title }}” ainda não está aberto para fotos.
        <template v-if="event.opensAt">
          A festa começa a ser fotografada em
          <strong class="font-medium text-stone-700">{{ formatDateTime(event.opensAt) }}</strong> —
          volte aqui nesse horário!
        </template>
        <template v-else> Volte um pouco mais tarde!</template>
      </p>
    </div>

    <!-- convite válido -->
    <div v-else class="w-full max-w-md text-center">
      <h1 class="font-display text-4xl font-semibold text-stone-800">Momentos</h1>
      <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400" />

      <p class="text-xs font-medium uppercase tracking-widest text-champagne-600">
        Você foi convidado para participar desse grande momento!
      </p>
      <!-- <h2 class="mt-2 font-display text-3xl font-medium text-stone-800">{{ event.title }}</h2> -->
      <!-- <p class="mt-2 text-sm font-light text-stone-500">
        {{ formatDate(event.eventDate) }}
      </p> -->

      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition-all duration-300 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <!-- passos 1 a 3 -->
        <div v-if="step < steps.length" :key="step" class="mt-10">
          <div class="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left">
            <span class="font-display text-2xl text-champagne-500">{{ steps[step].number }}</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <p class="text-sm text-stone-600" v-html="steps[step].html" />
          </div>

          <div class="mt-6 flex items-center justify-center gap-2">
            <span
              v-for="(item, index) in steps"
              :key="item.number"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="index === step ? 'w-6 bg-champagne-500' : 'w-1.5 bg-stone-200'"
            />
          </div>

          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-champagne-500 py-3.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
            @click="nextStep"
          >
            Prosseguir
          </button>
        </div>

        <!-- passo final: nome + começar -->
        <div v-else key="final" class="mt-10">
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

          <label
            class="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 text-left"
          >
            <input
              v-model="consent"
              type="checkbox"
              class="mt-0.5 h-4 w-4 shrink-0 accent-champagne-500"
            />
            <span class="text-xs font-light leading-relaxed text-stone-600">
              Autorizo que as fotos que eu enviar sejam compartilhadas com os noivos no álbum deste
              evento. Elas ficam disponíveis por 7 dias e depois são excluídas.
              <RouterLink
                to="/privacidade"
                target="_blank"
                class="font-medium text-champagne-600 underline underline-offset-2"
              >
                Política de privacidade
              </RouterLink>
            </span>
          </label>

          <button
            type="button"
            :disabled="!consent"
            class="mt-6 w-full rounded-lg bg-champagne-500 py-3.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-40"
            @click="handleStart"
          >
            Começar a fotografar 📸
          </button>
        </div>
      </Transition>
    </div>
  </main>
</template>
