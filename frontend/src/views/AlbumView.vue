<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppLoader from '../components/AppLoader.vue'
import { ApiError } from '../services/api'
import {
  downloadPublicAlbum,
  getPublicAlbum,
  type IEventPhoto,
  type IPublicAlbum,
} from '../services/events'

const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const album = ref<IPublicAlbum | null>(null)
const lightbox = ref<IEventPhoto | null>(null)

const downloading = ref(false)
const downloadError = ref('')

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
  lightbox.value = photos[(index + direction + photos.length) % photos.length]
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

async function handleDownload() {
  if (!album.value) return
  downloading.value = true
  downloadError.value = ''
  try {
    await downloadPublicAlbum(String(route.params.token), `momentos-${album.value.title}.zip`)
  } catch (error) {
    downloadError.value =
      error instanceof ApiError ? error.message : 'Não foi possível baixar o álbum'
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  try {
    album.value = await getPublicAlbum(String(route.params.token))
  } catch {
    // token inválido, não liberado ou revogado: tudo cai em "álbum não encontrado"
    notFound.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-16 font-sans">
    <section class="mx-auto max-w-3xl px-6 py-16">
      <AppLoader v-if="loading" label="Carregando álbum…" />

      <!-- token inválido / não liberado / revogado -->
      <div v-else-if="notFound" class="mt-16 text-center">
        <h1 class="font-display text-3xl font-medium text-stone-800">Álbum não encontrado</h1>
        <p class="mx-auto mt-3 max-w-md text-sm font-light text-stone-500">
          Este link não está mais disponível. Peça um link novo a quem organizou o seu evento.
        </p>
      </div>

      <template v-else-if="album">
        <header class="mb-10 text-center">
          <p class="text-xs font-medium tracking-widest text-champagne-600 uppercase">
            Álbum do casamento
          </p>
          <h1 class="mt-3 font-display text-4xl font-medium text-stone-800">{{ album.title }}</h1>
          <p class="mt-3 text-sm font-light text-stone-500">{{ formatDate(album.eventDate) }}</p>
          <p class="mt-1 text-xs text-stone-400">
            {{ album.total }} {{ album.total === 1 ? 'momento' : 'momentos' }}
            <template v-if="album.participants > 0">
              · {{ album.participants }}
              {{ album.participants === 1 ? 'convidado' : 'convidados' }}
            </template>
          </p>

          <button
            v-if="album.total > 0"
            type="button"
            :disabled="downloading"
            class="mt-6 rounded-lg bg-champagne-500 px-8 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:opacity-60"
            @click="handleDownload"
          >
            {{ downloading ? 'Preparando…' : 'Baixar álbum (.zip)' }}
          </button>
          <p v-if="downloadError" class="mt-3 text-xs text-red-500">{{ downloadError }}</p>
        </header>

        <p
          v-if="album.total === 0"
          class="mt-6 text-center text-sm font-light text-stone-400"
        >
          Nenhum momento neste álbum ainda
        </p>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
      </template>
    </section>

    <!-- lightbox read-only (sem lixeira) -->
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

    <AppFooter />
  </main>
</template>
