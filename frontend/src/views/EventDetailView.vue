<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import AppLoader from '../components/AppLoader.vue'
import { ApiError } from '../services/api'
import {
  downloadEventAlbum,
  getEvent,
  getEventQrCode,
  listEventPhotos,
  updateEvent,
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

// janela de envios (fixa em 16h a partir do início)
const WINDOW_HOURS = 16
const opensAtInput = ref('')
const savingWindow = ref(false)
const windowSaved = ref(false)
const windowError = ref('')

function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const expiresAtDisplay = computed(() => {
  if (!opensAtInput.value) return ''
  const opens = new Date(opensAtInput.value)
  const expires = new Date(opens.getTime() + WINDOW_HOURS * 60 * 60 * 1000)
  return expires.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
})

async function saveWindow() {
  if (!event.value) return
  savingWindow.value = true
  windowError.value = ''
  windowSaved.value = false
  try {
    event.value = await updateEvent(event.value.id, {
      opensAt: opensAtInput.value ? new Date(opensAtInput.value).toISOString() : null,
    })
    windowSaved.value = true
    setTimeout(() => (windowSaved.value = false), 2000)
  } catch (error) {
    windowError.value =
      error instanceof ApiError ? error.message : 'Não foi possível salvar. Tente novamente.'
  } finally {
    savingWindow.value = false
  }
}

// download do álbum completo
const downloadingAlbum = ref(false)
const downloadError = ref('')

async function handleDownloadAlbum() {
  if (!event.value) return
  downloadingAlbum.value = true
  downloadError.value = ''
  try {
    await downloadEventAlbum(event.value.id, `momentos-${event.value.title}.zip`)
  } catch (error) {
    downloadError.value =
      error instanceof ApiError ? error.message : 'Não foi possível baixar o álbum'
  } finally {
    downloadingAlbum.value = false
  }
}

// edição do evento
const editing = ref(false)
const savingEdit = ref(false)
const editError = ref('')
const editForm = ref({ title: '', eventDate: '' })

function openEdit() {
  if (!event.value) return
  editForm.value = {
    title: event.value.title,
    eventDate: event.value.eventDate,
  }
  editError.value = ''
  editing.value = true
}

async function saveEdit() {
  if (!event.value) return
  savingEdit.value = true
  editError.value = ''
  try {
    event.value = await updateEvent(event.value.id, { ...editForm.value })
    editing.value = false
  } catch (error) {
    editError.value =
      error instanceof ApiError ? error.message : 'Não foi possível salvar. Tente novamente.'
  } finally {
    savingEdit.value = false
  }
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
    opensAtInput.value = isoToLocalInput(event.value.opensAt)
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
      <AppLoader v-if="loading" label="Carregando evento…" />

      <template v-else-if="event">

        <div class="mt-2 text-left transition-all hover:scale-103">
          <button
            type="button"
            class="text-sm text-stone-500 transition hover:text-champagne-600"
            @click="router.push({ name: 'dashboard' })"
          >
            ← Voltar para meus eventos
          </button>
        </div>

        <header class="mb-10 text-center">
          <h2 class="font-display text-4xl font-medium text-stone-800">{{ event.title }}</h2>
          <p class="mt-3 text-sm font-light text-stone-500">
            {{ formatDate(event.eventDate) }}
          </p>
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-champagne-600 transition hover:text-champagne-500"
            @click="openEdit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-3.5 w-3.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
            Editar evento
          </button>
        </header>

        <div class="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <h3 class="font-display text-2xl font-medium text-stone-800">QR Code</h3>
          <p class="mx-auto mt-2 max-w-md text-sm font-light text-stone-500">
            Imprima e espalhe pelas mesas, cada convidado vira um fotógrafo do seu
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

        <!-- janela de envios -->
        <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-8">
          <h3 class="font-display text-2xl font-medium text-stone-800">Janela de envios</h3>
          <p class="mt-2 text-sm font-light text-stone-500">
            Defina o horário de início. Os convidados têm <strong>16 horas</strong> a partir dele
            para enviar fotos.
          </p>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                for="opens-at"
                class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
              >
                Início dos envios
              </label>
              <input
                id="opens-at"
                v-model="opensAtInput"
                type="datetime-local"
                class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600">
                Fim dos envios (automático)
              </label>
              <div
                class="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500"
              >
                {{ expiresAtDisplay || '—' }}
              </div>
            </div>
          </div>

          <p v-if="windowError" class="mt-4 text-sm text-red-500">{{ windowError }}</p>

          <button
            type="button"
            :disabled="savingWindow"
            class="mt-6 rounded-lg bg-champagne-500 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:opacity-60"
            @click="saveWindow"
          >
            {{ savingWindow ? 'Salvando…' : windowSaved ? 'Salvo!' : 'Salvar janela' }}
          </button>
        </div>

        <!-- álbum -->
        <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-8">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-display text-2xl font-medium text-stone-800">Álbum</h3>
            <div class="flex items-center gap-4">
              <p v-if="album" class="text-xs text-stone-400">
                {{ album.total }} {{ album.total === 1 ? 'momento' : 'momentos' }}
                <template v-if="album.participants > 0">
                  · {{ album.participants }}
                  {{ album.participants === 1 ? 'convidado' : 'convidados' }}
                </template>
              </p>
              <button
                v-if="album && album.total > 0"
                type="button"
                :disabled="downloadingAlbum"
                class="rounded-lg border border-champagne-400 px-4 py-2 text-xs font-medium text-champagne-600 transition hover:bg-champagne-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                @click="handleDownloadAlbum"
              >
                {{ downloadingAlbum ? 'Preparando…' : 'Baixar álbum (.zip)' }}
              </button>
            </div>
          </div>

          <p v-if="downloadError" class="mt-3 text-right text-xs text-red-500">
            {{ downloadError }}
          </p>

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
        <figcaption class="mt-3 flex items-center justify-center gap-4 text-sm text-white/70">
          <span v-if="lightbox.guestName">por {{ lightbox.guestName }}</span>
          <a
            :href="lightbox.downloadUrl"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-1.5 text-xs text-white transition hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-3.5 w-3.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Baixar
          </a>
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

    <!-- edição do evento -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="editing"
        class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 px-6 backdrop-blur-sm"
        @click.self="editing = false"
      >
        <form
          class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
          @submit.prevent="saveEdit"
        >
          <h3 class="text-center font-display text-2xl font-medium text-stone-800">
            Editar evento
          </h3>

          <div class="mt-6 space-y-4">
            <div>
              <label
                for="edit-title"
                class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
              >
                Nome do evento
              </label>
              <input
                id="edit-title"
                v-model="editForm.title"
                type="text"
                required
                class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
              />
            </div>
            <div>
              <label
                for="edit-date"
                class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
              >
                Data
              </label>
              <input
                id="edit-date"
                v-model="editForm.eventDate"
                type="date"
                required
                class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
              />
            </div>
          </div>

          <p v-if="editError" class="mt-4 text-sm text-red-500">{{ editError }}</p>

          <div class="mt-8 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              @click="editing = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="savingEdit"
              class="flex-1 rounded-lg bg-champagne-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:opacity-60"
            >
              {{ savingEdit ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <AppFooter />
  </main>
</template>
