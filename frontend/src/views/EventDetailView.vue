<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import AppLoader from '../components/AppLoader.vue'
import TimeSelect from '../components/TimeSelect.vue'
import { ApiError } from '../services/api'
import {
  deleteEventPhoto,
  downloadEventAlbum,
  getAlbumLink,
  getDisplayLink,
  getEvent,
  getEventQrCode,
  listEventPhotos,
  releaseAlbum,
  revokeAlbum,
  rotateDisplayLink,
  updateEvent,
  type IAlbumLink,
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

// telão da festa: link secreto, separado do QR, que o casal pode trocar
const displayUrl = ref('')
const displayCopied = ref(false)
const rotatingDisplay = ref(false)
const confirmRotateDisplay = ref(false)

async function copyDisplayLink() {
  await navigator.clipboard.writeText(displayUrl.value)
  displayCopied.value = true
  setTimeout(() => (displayCopied.value = false), 2000)
}

async function doRotateDisplayLink() {
  if (!event.value) return
  confirmRotateDisplay.value = false
  rotatingDisplay.value = true
  try {
    const { displayUrl: novo } = await rotateDisplayLink(event.value.id)
    displayUrl.value = novo
  } finally {
    rotatingDisplay.value = false
  }
}

// álbum curado do casal: link público read-only, liberado só depois da curadoria
const albumLink = ref<IAlbumLink>({ released: false, albumUrl: null, releasedAt: null })
const releasingAlbum = ref(false)
const albumCopied = ref(false)
const confirmRevokeAlbum = ref(false)

async function copyAlbumLink() {
  if (!albumLink.value.albumUrl) return
  await navigator.clipboard.writeText(albumLink.value.albumUrl)
  albumCopied.value = true
  setTimeout(() => (albumCopied.value = false), 2000)
}

async function doReleaseAlbum() {
  if (!event.value) return
  releasingAlbum.value = true
  try {
    albumLink.value = await releaseAlbum(event.value.id)
  } finally {
    releasingAlbum.value = false
  }
}

async function doRevokeAlbum() {
  if (!event.value) return
  confirmRevokeAlbum.value = false
  releasingAlbum.value = true
  try {
    albumLink.value = await revokeAlbum(event.value.id)
  } finally {
    releasingAlbum.value = false
  }
}

// exclusão de foto do álbum: some do S3 e do banco, não tem como desfazer
const photoToDelete = ref<IEventPhoto | null>(null)
const deletingPhotoId = ref<string | null>(null)
const deletePhotoError = ref('')

function askDeletePhoto(photo: IEventPhoto) {
  deletePhotoError.value = ''
  photoToDelete.value = photo
}

async function confirmDeletePhoto() {
  const photo = photoToDelete.value
  if (!photo || !event.value) return
  photoToDelete.value = null
  deletingPhotoId.value = photo.id

  try {
    await deleteEventPhoto(event.value.id, photo.id)

    // recalcula na mão em vez de recarregar o álbum: as URLs das outras fotos
    // são assinadas e recarregar faria o navegador buscar todas de novo
    if (album.value) {
      const restantes = album.value.photos.filter((item) => item.id !== photo.id)
      album.value = {
        photos: restantes,
        total: restantes.length,
        participants: new Set(
          restantes.map((item) => item.guestName).filter((name) => name !== null),
        ).size,
      }
    }
    if (lightbox.value?.id === photo.id) {
      closeLightbox()
    }
  } catch (error) {
    deletePhotoError.value =
      error instanceof ApiError ? error.message : 'Não foi possível excluir a foto'
  } finally {
    deletingPhotoId.value = null
  }
}

// horário de início: os envios abrem aqui e ficam 24h abertos
const WINDOW_HOURS = 24

function isoToTimeInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
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
const editForm = ref({ title: '', eventDate: '', startTime: '' })

function openEdit() {
  if (!event.value) return
  editForm.value = {
    title: event.value.title,
    eventDate: event.value.eventDate,
    startTime: isoToTimeInput(event.value.opensAt),
  }
  editError.value = ''
  editing.value = true
}

// fim dos envios previsto a partir da data + horário de início do formulário
const editExpiresAtDisplay = computed(() => {
  const { eventDate, startTime } = editForm.value
  if (!eventDate || !startTime) return ''
  const opens = new Date(`${eventDate}T${startTime}`)
  const expires = new Date(opens.getTime() + WINDOW_HOURS * 60 * 60 * 1000)
  return expires.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
})

async function saveEdit() {
  if (!event.value) return
  savingEdit.value = true
  editError.value = ''
  try {
    const { title, eventDate, startTime } = editForm.value
    // início dos envios = data da festa + horário escolhido; backend deriva o fim (24h)
    const opensAt = startTime ? new Date(`${eventDate}T${startTime}`).toISOString() : null
    event.value = await updateEvent(event.value.id, { title, eventDate, opensAt })
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
    const [qr, albumData, display, albumLinkData] = await Promise.all([
      getEventQrCode(id),
      listEventPhotos(id),
      getDisplayLink(id),
      getAlbumLink(id),
    ])
    qrCode.value = qr.qrCode
    guestLink.value = qr.guestLink
    album.value = albumData
    displayUrl.value = display.displayUrl
    albumLink.value = albumLinkData
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
            v-if="deletePhotoError"
            class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600"
          >
            {{ deletePhotoError }}
          </p>

          <p
            v-if="!album || album.total === 0"
            class="mt-6 text-center text-sm font-light text-stone-400"
          >
            Nenhum momento registrado ainda
          </p>

          <div v-else class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
              v-for="photo in album.photos"
              :key="photo.id"
              class="group relative aspect-square overflow-hidden rounded-xl bg-ivory-100"
              :class="deletingPhotoId === photo.id && 'opacity-40'"
            >
              <button type="button" class="block h-full w-full" @click="openLightbox(photo)">
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

              <!-- no toque não existe hover: aparece sempre. No mouse, só ao passar
                   por cima, p/ não poluir o álbum com um ícone em cada foto -->
              <button
                type="button"
                :disabled="deletingPhotoId === photo.id"
                aria-label="Excluir foto"
                title="Excluir foto"
                class="absolute right-2 bottom-2 rounded-md bg-white/85 p-1.5 text-stone-500 backdrop-blur transition hover:bg-white hover:text-red-500 disabled:opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                @click.stop="askDeletePhoto(photo)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="h-4 w-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div> 

        <div class="rounded-2xl border border-stone-200 bg-white p-8 text-center mt-8">
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

        <!-- telão da festa -->
        <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-8">
          <h3 class="font-display text-2xl font-medium text-stone-800">Telão da festa</h3>
          <p class="mx-auto mt-2 max-w-lg text-sm font-light text-stone-500">
            Abra este link no computador ligado ao projetor. As fotos vão aparecer sozinhas, e a
            que acabou de chegar fura a fila para o convidado se ver na hora.
          </p>

          <p class="mt-4 rounded-lg bg-ivory-100 px-4 py-3 text-xs font-light text-stone-600">
            É um link secreto, diferente do QR das mesas — quem tem ele projeta, mas não entra na
            sua conta. Pode passar para o DJ ou para o cerimonial sem receio.
          </p>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              :href="displayUrl"
              target="_blank"
              rel="noopener"
              class="flex-1 rounded-lg bg-champagne-500 py-2.5 text-center text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
            >
              Abrir o telão
            </a>
            <button
              type="button"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              @click="copyDisplayLink"
            >
              {{ displayCopied ? 'Link copiado ✓' : 'Copiar link' }}
            </button>
          </div>

          <button
            type="button"
            :disabled="rotatingDisplay"
            class="mt-4 text-xs text-stone-400 underline underline-offset-2 transition hover:text-stone-600 disabled:opacity-50"
            @click="confirmRotateDisplay = true"
          >
            {{ rotatingDisplay ? 'Gerando…' : 'Gerar um link novo' }}
          </button>
        </div>

        <!-- álbum curado do casal -->
        <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-8">
          <h3 class="font-display text-2xl font-medium text-stone-800">Álbum do casal</h3>
          <p class="mx-auto mt-2 max-w-lg text-sm font-light text-stone-500">
            Depois de revisar as fotos acima e tirar o que não quiser, libere o álbum curado
            para o casal. Eles recebem um link só de visualização — não entram na sua conta e
            não editam nada.
          </p>

          <!-- ainda não liberado -->
          <template v-if="!albumLink.released">
            <p class="mt-4 rounded-lg bg-ivory-100 px-4 py-3 text-xs font-light text-stone-600">
              O casal só vê o álbum depois que você liberar. Enquanto isso, a curadoria fica só
              com você.
            </p>
            <button
              type="button"
              :disabled="releasingAlbum"
              class="mt-6 w-full rounded-lg bg-champagne-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:opacity-60 sm:w-auto sm:px-8"
              @click="doReleaseAlbum"
            >
              {{ releasingAlbum ? 'Liberando…' : 'Liberar álbum para o casal' }}
            </button>
          </template>

          <!-- já liberado -->
          <template v-else>
            <p
              class="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-xs font-medium text-green-700"
            >
              <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              Álbum liberado — o casal já pode acessar por este link.
            </p>
            <p class="mt-3 break-all text-xs text-stone-400">{{ albumLink.albumUrl }}</p>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                :href="albumLink.albumUrl!"
                target="_blank"
                rel="noopener"
                class="flex-1 rounded-lg bg-champagne-500 py-2.5 text-center text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
              >
                Abrir o álbum
              </a>
              <button
                type="button"
                class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
                @click="copyAlbumLink"
              >
                {{ albumCopied ? 'Link copiado ✓' : 'Copiar link' }}
              </button>
            </div>

            <button
              type="button"
              :disabled="releasingAlbum"
              class="mt-4 text-xs text-stone-400 underline underline-offset-2 transition hover:text-stone-600 disabled:opacity-50"
              @click="confirmRevokeAlbum = true"
            >
              {{ releasingAlbum ? 'Processando…' : 'Revogar o link do casal' }}
            </button>
          </template>
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
            <div>
              <label
                for="edit-start-time"
                class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
              >
                Começa às
              </label>
              <TimeSelect id="edit-start-time" v-model="editForm.startTime" required />
              <p class="mt-2 text-xs font-light text-stone-400">
                A partir desse horário, os convidados têm <strong>24 horas</strong> para enviar
                fotos<template v-if="editExpiresAtDisplay">
                  — até {{ editExpiresAtDisplay }}</template
                >.
              </p>
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

    <!-- trocar o link do telão derruba o que já estiver projetando -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="confirmRotateDisplay"
        class="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/20 px-6 backdrop-blur-sm"
        @click.self="confirmRotateDisplay = false"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <h3 class="font-display text-2xl font-medium text-stone-800">Gerar um link novo?</h3>
          <p class="mt-2 text-sm font-light text-stone-500">
            O link atual para de funcionar na hora. Se o telão estiver projetando agora, ele para
            e você precisa abrir o link novo. O QR das mesas não muda.
          </p>

          <div class="mt-8 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              @click="confirmRotateDisplay = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-champagne-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
              @click="doRotateDisplayLink"
            >
              Gerar novo
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- revogar o link do casal: mata o link atual; liberar de novo gera outro -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="confirmRevokeAlbum"
        class="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/20 px-6 backdrop-blur-sm"
        @click.self="confirmRevokeAlbum = false"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <h3 class="font-display text-2xl font-medium text-stone-800">Revogar o link?</h3>
          <p class="mt-2 text-sm font-light text-stone-500">
            O link atual para de funcionar na hora e o casal deixa de ver o álbum. Se liberar de
            novo depois, o link será diferente.
          </p>

          <div class="mt-8 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              @click="confirmRevokeAlbum = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-red-600"
              @click="doRevokeAlbum"
            >
              Revogar
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- confirmação de exclusão de foto: sai do álbum e do storage, sem volta -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="photoToDelete"
        class="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/20 px-6 backdrop-blur-sm"
        @click.self="photoToDelete = null"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <img
            :src="photoToDelete.url"
            alt=""
            class="mx-auto h-28 w-28 rounded-xl object-cover"
          />

          <h3 class="mt-4 font-display text-2xl font-medium text-stone-800">Excluir esta foto?</h3>
          <p class="mt-2 text-sm font-light text-stone-500">
            <template v-if="photoToDelete.guestName">
              O momento enviado por
              <strong class="font-medium text-stone-600">{{ photoToDelete.guestName }}</strong>
              sai do álbum para sempre.
            </template>
            <template v-else>Este momento sai do álbum para sempre.</template>
            Essa ação não pode ser desfeita.
          </p>

          <div class="mt-8 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              @click="photoToDelete = null"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-red-600"
              @click="confirmDeletePhoto"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <AppFooter />
  </main>
</template>
