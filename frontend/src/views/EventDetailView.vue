<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { ApiError } from '../services/api'
import {
  getEvent,
  getEventQrCode,
  listEventPhotos,
  type IEventAlbum,
  type IEventPhoto,
  type IEventResponse,
} from '../services/events'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const event = ref<IEventResponse | null>(null)
const qrCode = ref('')
const guestLink = ref('')
const copied = ref(false)

const album = ref<IEventAlbum | null>(null)
const lightbox = ref<IEventPhoto | null>(null)

function openLightbox(photo: IEventPhoto) {
  lightbox.value = photo
}

function closeLightbox() {
  lightbox.value = null
}

function lightboxStep(direction: 1 | -1) {
  if (!album.value || !lightbox.value) return
  const photos = album.value.photos
  const index = photos.findIndex((photo) => photo.id === lightbox.value!.id)
  const next = photos[(index + direction + photos.length) % photos.length]
  lightbox.value = next
}

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
    const [qr, albumData] = await Promise.all([getEventQrCode(id), listEventPhotos(id)])
    qrCode.value = qr.qrCode
    guestLink.value = qr.guestLink
    album.value = albumData
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

        <!-- álbum -->
        <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-8">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="font-display text-2xl font-medium text-stone-800">Álbum</h3>
            <p v-if="album" class="text-xs text-stone-400">
              {{ album.total }} {{ album.total === 1 ? 'momento' : 'momentos' }}
              <template v-if="album.participants > 0">
                · {{ album.participants }}
                {{ album.participants === 1 ? 'convidado' : 'convidados' }}
              </template>
            </p>
          </div>

          <p
            v-if="!album || album.total === 0"
            class="mt-6 text-center text-sm font-light text-stone-400"
          >
            Nenhum momento ainda — compartilhe o QR Code e deixe a festa fotografar ✨
          </p>

          <div v-else class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              v-for="photo in album.photos"
              :key="photo.id"
              type="button"
              class="group relative aspect-square overflow-hidden rounded-xl bg-ivory-100"
              @click="openLightbox(photo)"
            >
              <img
                :src="photo.url"
                :alt="photo.guestName ? `Foto de ${photo.guestName}` : 'Foto do evento'"
                loading="lazy"
                class="h-full w-full object-cover transition group-hover:scale-105"
              />
              <span
                v-if="photo.guestName"
                class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-left text-xs text-white"
              >
                {{ photo.guestName }}
              </span>
            </button>
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

    <!-- lightbox -->
    <div
      v-if="lightbox"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      @click.self="closeLightbox"
    >
      <button
        type="button"
        aria-label="Fechar"
        class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
        @click="closeLightbox"
      >
        ✕
      </button>
      <button
        type="button"
        aria-label="Anterior"
        class="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white sm:left-6"
        @click="lightboxStep(-1)"
      >
        ‹
      </button>
      <figure class="max-h-full">
        <img
          :src="lightbox.url"
          alt="Foto ampliada"
          class="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
        <figcaption v-if="lightbox.guestName" class="mt-3 text-center text-sm text-white/70">
          por {{ lightbox.guestName }}
        </figcaption>
      </figure>
      <button
        type="button"
        aria-label="Próxima"
        class="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white sm:right-6"
        @click="lightboxStep(1)"
      >
        ›
      </button>
    </div>

    <AppFooter />
  </main>
</template>
