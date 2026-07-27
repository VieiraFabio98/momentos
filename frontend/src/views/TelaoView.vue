<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '../services/api'
import { getDisplayFeed, type IDisplayPhoto } from '../services/events'

const route = useRoute()
const token = computed(() => String(route.params.token ?? ''))

const PHOTO_MS = 7000 // tempo de cada foto no telão
const POLL_MS = 15000 // de quanto em quanto tempo pergunta por foto nova
const FULL_RELOAD_MS = 40 * 60 * 1000 // URLs do S3 valem 1h; recarrega antes disso
const IDLE_MS = 3000 // some com o cursor e os controles

const loading = ref(true)
const errorMessage = ref('')
const title = ref('')
const qrCode = ref('')
const total = ref(0)

const photos = ref<IDisplayPhoto[]>([])
const current = ref<IDisplayPhoto | null>(null)
const currentIsNew = ref(false)

// fotos recém-chegadas furam a fila: o convidado manda e vê no telão em segundos
const priorityQueue = ref<string[]>([])
let sequentialIndex = 0

const idle = ref(false)
const isFullscreen = ref(false)
let idleTimer: number | undefined
let photoTimer: number | undefined
let pollTimer: number | undefined
let fullReloadTimer: number | undefined
let wakeLock: WakeLockSentinel | null = null

const newestCreatedAt = computed(() =>
  photos.value.reduce((max, photo) => (photo.createdAt > max ? photo.createdAt : max), ''),
)

function preload(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = url
    // não trava a apresentação se uma imagem demorar
    setTimeout(resolve, 2500)
  })
}

function pickNext(): { photo: IDisplayPhoto; isNew: boolean } | null {
  if (photos.value.length === 0) return null

  while (priorityQueue.value.length > 0) {
    const id = priorityQueue.value.shift()!
    const photo = photos.value.find((item) => item.id === id)
    if (photo) return { photo, isNew: true }
  }

  sequentialIndex = sequentialIndex % photos.value.length
  const photo = photos.value[sequentialIndex]
  sequentialIndex += 1
  return { photo, isNew: false }
}

async function advance() {
  const next = pickNext()
  if (!next) {
    current.value = null
    return
  }

  await preload(next.photo.url)
  current.value = next.photo
  currentIsNew.value = next.isNew

  window.clearTimeout(photoTimer)
  photoTimer = window.setTimeout(advance, PHOTO_MS)
}

async function loadFull() {
  const feed = await getDisplayFeed(token.value)
  title.value = feed.title
  total.value = feed.total
  if (feed.qrCode) qrCode.value = feed.qrCode

  const eraVazio = photos.value.length === 0
  photos.value = feed.photos
  if (eraVazio && feed.photos.length > 0) {
    sequentialIndex = 0
    await advance()
  }
}

async function poll() {
  try {
    const since = newestCreatedAt.value
    const feed = await getDisplayFeed(token.value, since || undefined)
    total.value = feed.total

    // o casal pode ter apagado uma foto pela lixeira do álbum
    if (feed.photoIds) {
      const vivos = new Set(feed.photoIds)
      photos.value = photos.value.filter((photo) => vivos.has(photo.id))
      if (current.value && !vivos.has(current.value.id)) {
        await advance()
      }
    }

    if (feed.photos.length > 0) {
      photos.value = [...photos.value, ...feed.photos]
      priorityQueue.value.push(...feed.photos.map((photo) => photo.id))
      // primeira foto da festa: começa a apresentação na hora
      if (!current.value) await advance()
    }
  } catch {
    // wi-fi de salão de festa cai o tempo todo; a próxima rodada tenta de novo
  }
}

function resetIdle() {
  idle.value = false
  window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => (idle.value = true), IDLE_MS)
}

async function requestWakeLock() {
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null
  } catch {
    // navegador sem suporte ou sem permissão: o projetor pode apagar sozinho
  }
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
    isFullscreen.value = false
  } else {
    await document.documentElement.requestFullscreen()
    isFullscreen.value = true
    // o gesto do usuário é a única janela em que o wake lock é concedido
    await requestWakeLock()
  }
}

async function handleVisibility() {
  if (document.visibilityState === 'visible' && wakeLock === null) {
    await requestWakeLock()
  }
}

onMounted(async () => {
  try {
    await loadFull()
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError && error.status === 404
        ? 'Telão não encontrado. Confira o link com o casal.'
        : 'Não foi possível carregar o telão'
  } finally {
    loading.value = false
  }

  pollTimer = window.setInterval(poll, POLL_MS)
  fullReloadTimer = window.setInterval(() => void loadFull().catch(() => {}), FULL_RELOAD_MS)
  document.addEventListener('visibilitychange', handleVisibility)
  resetIdle()
})

onBeforeUnmount(() => {
  window.clearTimeout(photoTimer)
  window.clearTimeout(idleTimer)
  window.clearInterval(pollTimer)
  window.clearInterval(fullReloadTimer)
  document.removeEventListener('visibilitychange', handleVisibility)
  void wakeLock?.release()
})
</script>

<template>
  <main
    class="relative h-screen w-screen overflow-hidden bg-black font-sans text-white"
    :class="idle && 'cursor-none'"
    @mousemove="resetIdle"
    @touchstart="resetIdle"
  >
    <p v-if="loading" class="flex h-full items-center justify-center text-sm text-white/40">
      Preparando o telão…
    </p>

    <div
      v-else-if="errorMessage"
      class="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
    >
      <h1 class="font-display text-4xl font-medium">Momentos</h1>
      <p class="text-sm font-light text-white/50">{{ errorMessage }}</p>
    </div>

    <!-- ninguém mandou foto ainda: a tela vira o convite -->
    <div
      v-else-if="!current"
      class="flex h-full flex-col items-center justify-center gap-8 px-8 text-center"
    >
      <div>
        <h1 class="font-display text-5xl font-medium tracking-tight sm:text-7xl">{{ title }}</h1>
        <div class="mx-auto mt-6 h-px w-24 bg-champagne-400/60" />
      </div>
      <p class="max-w-xl text-lg font-light text-white/70 sm:text-2xl">
        Aponte a câmera do celular para o código e mande a primeira foto da festa
      </p>
      <img v-if="qrCode" :src="qrCode" alt="QR Code para enviar fotos" class="w-56 rounded-2xl sm:w-72" />
    </div>

    <template v-else>
      <!-- as duas camadas se sobrepõem durante a troca, o que faz o cross-fade -->
      <Transition
        enter-active-class="transition-opacity duration-1000 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-1000 ease-out"
        leave-to-class="opacity-0"
      >
        <div :key="current.id" class="absolute inset-0 flex items-center justify-center">
          <!-- fundo desfocado preenche as sobras de fotos em pé, sem cortar nada -->
          <img
            :src="current.url"
            alt=""
            aria-hidden="true"
            class="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
          />
          <img
            :src="current.url"
            :alt="current.guestName ? `Foto de ${current.guestName}` : 'Foto da festa'"
            class="ken-burns relative max-h-full max-w-full object-contain"
          />
        </div>
      </Transition>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-linear-to-t from-black/80 to-transparent px-10 pt-24 pb-8">
        <div>
          <Transition
            enter-active-class="transition duration-500"
            enter-from-class="opacity-0 translate-y-2"
          >
            <p v-if="currentIsNew" :key="current.id" class="mb-2 text-xs tracking-[0.2em] text-champagne-300 uppercase">
              Acabou de chegar
            </p>
          </Transition>
          <p v-if="current.guestName" class="font-display text-3xl font-medium">
            {{ current.guestName }}
          </p>
          <p class="text-sm font-light text-white/50">
            {{ total }} {{ total === 1 ? 'momento' : 'momentos' }} · {{ title }}
          </p>
        </div>

        <div v-if="qrCode" class="flex items-center gap-3 text-right">
          <p class="max-w-32 text-xs font-light text-white/60">
            Escaneie e mande a sua foto
          </p>
          <img :src="qrCode" alt="QR Code para enviar fotos" class="w-24 rounded-lg bg-white p-1" />
        </div>
      </div>
    </template>

    <button
      v-if="!loading && !errorMessage"
      type="button"
      class="absolute top-6 right-6 rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-xs tracking-wide text-white/70 backdrop-blur transition hover:bg-black/70 hover:text-white"
      :class="idle && 'opacity-0'"
      @click="toggleFullscreen"
    >
      {{ isFullscreen ? 'Sair da tela cheia' : 'Tela cheia' }}
    </button>
  </main>
</template>

<style scoped>
/* deriva lenta: em foto parada por 7 segundos, faz o telão respirar */
@keyframes ken-burns {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
}

.ken-burns {
  animation: ken-burns 8s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .ken-burns {
    animation: none;
  }
}
</style>
