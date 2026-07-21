<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import AppLoader from '../components/AppLoader.vue'
import { ApiError } from '../services/api'
import { deleteEvent, listMyEvents, type IEventResponse } from '../services/events'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const events = ref<IEventResponse[]>([])

const planLabels: Record<string, string> = {
  degustacao: 'Degustação',
  momento: 'Momento',
  memoria: 'Memória',
}

const statusLabels: Record<string, { text: string; classes: string }> = {
  draft: { text: 'Aguardando ativação', classes: 'bg-amber-50 text-amber-700' },
  active: { text: 'Ativo', classes: 'bg-emerald-50 text-emerald-700' },
  expired: { text: 'Encerrado', classes: 'bg-stone-100 text-stone-500' },
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const deletingId = ref<string | null>(null)
const confirmTarget = ref<IEventResponse | null>(null)

function askDelete(event: IEventResponse) {
  confirmTarget.value = event
}

async function confirmDelete() {
  const event = confirmTarget.value
  if (!event) return
  confirmTarget.value = null
  deletingId.value = event.id
  try {
    await deleteEvent(event.id)
    events.value = events.value.filter((item) => item.id !== event.id)
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  try {
    if (!auth.user) {
      await auth.fetchMe()
    }
    events.value = await listMyEvents()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      auth.logout()
      router.push({ name: 'login' })
      return
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-16 font-sans">
    <AppHeader />

    <section class="mx-auto max-w-6xl px-6 py-16">
      <AppLoader v-if="loading" label="Preparando seus momentos…" />

      <template v-else-if="events.length === 0">
        <div class="text-center">
          <h2 class="font-display text-4xl font-medium text-stone-800">Seu evento</h2>
          <p class="mx-auto mt-3 max-w-md text-sm font-light text-stone-500">
            Crie seu dia especial e comece a colecionar os momentos.
          </p>
          <button
            type="button"
            class="mt-8 rounded-lg bg-champagne-500 px-8 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
            @click="router.push({ name: 'event-create' })"
          >
            Criar evento
          </button>
        </div>
      </template>

      <template v-else>
        <div class="mb-8 flex items-center justify-between">
          <h2 class="font-display text-3xl font-medium text-stone-800">Seu evento</h2>
          <button
            type="button"
            class="rounded-lg bg-champagne-500 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
            @click="router.push({ name: 'event-create' })"
          >
            Criar evento
          </button>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="event in events"
            :key="event.id"
            class="group relative cursor-pointer rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-champagne-300 hover:shadow-sm"
            @click="router.push({ name: 'event-detail', params: { id: event.id } })"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-display text-xl font-medium text-stone-800">{{ event.title }}</h3>
              <span
                class="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                :class="statusLabels[event.status]?.classes"
              >
                {{ statusLabels[event.status]?.text }}
              </span>
            </div>

            <dl class="mt-4 space-y-2 text-sm text-stone-500">
              <div class="flex items-center gap-2">
                <span class="text-champagne-500">✦</span>
                {{ formatDate(event.eventDate) }}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-champagne-500">✦</span>
                Plano {{ planLabels[event.plan] ?? event.plan }}
              </div>
            </dl>

            <button
              v-if="event.plan === 'degustacao'"
              type="button"
              :disabled="deletingId === event.id"
              aria-label="Excluir evento"
              title="Excluir evento"
              class="absolute right-4 bottom-4 rounded-md p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-400 disabled:opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
              @click.stop="askDelete(event)"
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
          </article>
        </div>
      </template>
    </section>

    <!-- confirmação de exclusão -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="confirmTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 px-6 backdrop-blur-sm"
        @click.self="confirmTarget = null"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <span
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </span>

          <h3 class="mt-4 font-display text-2xl font-medium text-stone-800">Excluir evento?</h3>
          <p class="mt-2 text-sm font-light text-stone-500">
            “{{ confirmTarget.title }}” será excluído e as fotos enviadas serão perdidas. Essa ação
            não pode ser desfeita.
          </p>

          <div class="mt-8 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              @click="confirmTarget = null"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-red-600"
              @click="confirmDelete"
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
