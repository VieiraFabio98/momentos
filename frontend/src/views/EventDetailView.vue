<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { ApiError } from '../services/api'
import { getEvent, getEventQrCode, type IEventResponse } from '../services/events'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const event = ref<IEventResponse | null>(null)
const qrCode = ref('')
const guestLink = ref('')
const copied = ref(false)

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

async function copyLink() {
  await navigator.clipboard.writeText(guestLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

onMounted(async () => {
  const id = String(route.params.id)
  try {
    event.value = await getEvent(id)
    const qr = await getEventQrCode(id)
    qrCode.value = qr.qrCode
    guestLink.value = qr.guestLink
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      router.push({ name: 'login' })
      return
    }
    router.push({ name: 'dashboard' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-16 font-sans">
    <AppHeader />

    <section class="mx-auto max-w-3xl px-6 py-16">
      <p v-if="loading" class="text-center text-stone-400">Carregando…</p>

      <template v-else-if="event">
        <header class="mb-10 text-center">
          <h2 class="font-display text-4xl font-medium text-stone-800">{{ event.title }}</h2>
          <p class="mt-3 text-sm font-light text-stone-500">
            {{ formatDate(event.eventDate) }} · {{ event.location }}
          </p>
        </header>

        <div class="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <h3 class="font-display text-2xl font-medium text-stone-800">QR Code dos convidados</h3>
          <p class="mx-auto mt-2 max-w-md text-sm font-light text-stone-500">
            Imprima e espalhe pelas mesas — cada convidado que escanear vira um fotógrafo do seu
            grande dia
          </p>

          <img
            v-if="qrCode"
            :src="qrCode"
            alt="QR Code do evento"
            class="mx-auto mt-6 w-64 rounded-xl border border-ivory-200"
          />

          <p class="mt-4 break-all text-xs text-stone-400">{{ guestLink }}</p>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              class="rounded-lg border border-champagne-400 px-6 py-2.5 text-sm font-medium text-champagne-600 transition hover:bg-champagne-500 hover:text-white"
              @click="copyLink"
            >
              {{ copied ? 'Copiado!' : 'Copiar link' }}
            </button>
            <a
              :href="qrCode"
              download="qrcode-momentos.png"
              class="rounded-lg bg-champagne-500 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
            >
              Baixar QR Code
            </a>
          </div>
        </div>

        <div class="mt-8 text-center">
          <button
            type="button"
            class="text-sm text-stone-500 transition hover:text-champagne-600"
            @click="router.push({ name: 'dashboard' })"
          >
            ← Voltar para meus eventos
          </button>
        </div>
      </template>
    </section>

    <AppFooter />
  </main>
</template>
