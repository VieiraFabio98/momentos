<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  confirmPhotoUpload,
  getGuestName,
  requestPhotoUpload,
  uploadToStorage,
} from '../services/guest'

const route = useRoute()
const router = useRouter()
const token = String(route.params.token ?? '')
const guestName = getGuestName()

const videoRef = ref<HTMLVideoElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const cameraReady = ref(false)
const cameraFailed = ref(false)
const capturedBlob = ref<Blob | null>(null)
const capturedUrl = ref('')
const sending = ref(false)
const sentCount = ref(0)
const errorMessage = ref('')

let stream: MediaStream | null = null

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8

// FLAG: moldura polaroid nas fotos. Não gostou? `false` aqui desliga tudo.
const POLAROID_FRAME_ENABLED = true

const facingMode = ref<'environment' | 'user'>('environment')
const flipping = ref(false)

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
      cameraReady.value = true
    }
  } catch {
    cameraFailed.value = true
  }
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
}

async function flipCamera() {
  if (flipping.value) return
  flipping.value = true

  stopCamera()
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  try {
    await startCamera()
  } finally {
    flipping.value = false
  }
}

function applyPolaroidFrame(photo: HTMLCanvasElement): HTMLCanvasElement {
  const border = Math.round(Math.max(photo.width, photo.height) * 0.045)
  const bottomBorder = border * 4

  const framed = document.createElement('canvas')
  framed.width = photo.width + border * 2
  framed.height = photo.height + border + bottomBorder

  const ctx = framed.getContext('2d')!
  ctx.fillStyle = '#fdfcf7'
  ctx.fillRect(0, 0, framed.width, framed.height)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
  ctx.shadowBlur = border * 0.4
  ctx.drawImage(photo, border, border)
  ctx.restore()

  return framed
}

function compressToJpeg(source: HTMLVideoElement | HTMLImageElement): Promise<Blob> {
  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  let canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)

  if (POLAROID_FRAME_ENABLED) {
    canvas = applyPolaroidFrame(canvas)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

async function capture() {
  if (!videoRef.value) return
  errorMessage.value = ''
  capturedBlob.value = await compressToJpeg(videoRef.value)
  capturedUrl.value = URL.createObjectURL(capturedBlob.value)
}

async function handleFileFallback(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  errorMessage.value = ''

  const image = new Image()
  image.src = URL.createObjectURL(file)
  await new Promise((resolve) => (image.onload = resolve))
  capturedBlob.value = await compressToJpeg(image)
  capturedUrl.value = URL.createObjectURL(capturedBlob.value)
  URL.revokeObjectURL(image.src)
}

function discardCapture() {
  URL.revokeObjectURL(capturedUrl.value)
  capturedBlob.value = null
  capturedUrl.value = ''
}

async function sendPhoto() {
  if (!capturedBlob.value) return
  sending.value = true
  errorMessage.value = ''

  try {
    const { uploadUrl, storageKey } = await requestPhotoUpload(token, 'image/jpeg')
    await uploadToStorage(uploadUrl, capturedBlob.value)
    await confirmPhotoUpload(token, storageKey, guestName)

    sentCount.value++
    discardCapture()
  } catch {
    errorMessage.value = 'Não foi possível enviar. Tente de novo.'
  } finally {
    sending.value = false
  }
}

onMounted(startCamera)
onBeforeUnmount(stopCamera)
</script>

<template>
  <main class="relative flex min-h-dvh flex-col bg-stone-950 font-sans">
    <!-- topo -->
    <header class="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
      <button
        type="button"
        class="rounded-full bg-black/40 px-4 py-2 text-xs text-white backdrop-blur"
        @click="router.push({ name: 'guest-landing', params: { token } })"
      >
        ← Voltar
      </button>
      <span
        v-if="sentCount > 0"
        class="rounded-full bg-black/40 px-4 py-2 text-xs text-white backdrop-blur"
      >
        {{ sentCount }} {{ sentCount === 1 ? 'momento enviado' : 'momentos enviados' }} ✨
      </span>
    </header>

    <!-- câmera ao vivo — sempre montada p/ manter o stream vivo -->
    <video
      v-show="cameraReady && !capturedUrl"
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="min-h-dvh w-full object-cover"
      :class="{ '-scale-x-100': facingMode === 'user' }"
    />

    <!-- preview da foto capturada (overlay) -->
    <div v-if="capturedUrl" class="absolute inset-0 z-10 bg-stone-950">
      <img :src="capturedUrl" alt="Prévia da foto" class="h-full w-full object-contain" />
      <footer class="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 to-transparent p-6 pb-10">
        <p v-if="errorMessage" class="mb-4 text-center text-sm text-red-400">{{ errorMessage }}</p>
        <div class="flex items-center justify-center gap-4">
          <button
            type="button"
            :disabled="sending"
            class="rounded-full border border-white/40 px-6 py-3 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
            @click="discardCapture"
          >
            Tirar outra
          </button>
          <button
            type="button"
            :disabled="sending"
            class="rounded-full bg-champagne-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-champagne-600 disabled:opacity-60"
            @click="sendPhoto"
          >
            {{ sending ? 'Enviando…' : 'Enviar momento' }}
          </button>
        </div>
      </footer>
    </div>

    <!-- fallback sem câmera -->
    <div
      v-if="cameraFailed && !capturedUrl"
      class="flex min-h-dvh flex-col items-center justify-center px-8 text-center"
    >
      <p class="font-display text-2xl text-white">Câmera indisponível</p>
      <p class="mt-2 text-sm font-light text-stone-400">
        Sem problema — use o botão abaixo para tirar a foto pelo app de câmera do celular
      </p>
      <button
        type="button"
        class="mt-8 rounded-full bg-champagne-500 px-8 py-3 text-sm font-medium text-white"
        @click="fileInputRef?.click()"
      >
        Abrir câmera do celular
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="handleFileFallback"
      />
    </div>

    <p
      v-if="!cameraReady && !cameraFailed && !capturedUrl"
      class="absolute inset-0 flex items-center justify-center text-sm text-stone-400"
    >
      Abrindo câmera…
    </p>

    <!-- disparador + flip -->
    <footer
      v-if="cameraReady && !capturedUrl"
      class="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center bg-linear-to-t from-black/70 to-transparent p-6 pb-10"
    >
      <button
        type="button"
        aria-label="Tirar foto"
        class="h-18 w-18 rounded-full border-4 border-white/80 bg-white/20 p-1 backdrop-blur transition active:scale-90"
        @click="capture"
      >
        <span class="block h-full w-full rounded-full bg-white" />
      </button>

      <button
        type="button"
        aria-label="Virar câmera"
        :disabled="flipping"
        class="absolute right-8 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition active:scale-90 disabled:opacity-50"
        @click="flipCamera"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
        >
          <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
          <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
          <circle cx="12" cy="12" r="3" />
          <path d="m18 22-3-3 3-3" />
          <path d="m6 2 3 3-3 3" />
        </svg>
      </button>
    </footer>
  </main>
</template>
