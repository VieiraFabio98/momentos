<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { ApiError } from '../services/api'
import { listMyEvents, type IEventResponse } from '../services/events'
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
      <p v-if="loading" class="text-center text-stone-400">Carregando…</p>

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
          <h2 class="font-display text-3xl font-medium text-stone-800">Seus eventos</h2>
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
            class="cursor-pointer rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-champagne-300 hover:shadow-sm"
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
                {{ event.location }}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-champagne-500">✦</span>
                Plano {{ planLabels[event.plan] ?? event.plan }}
              </div>
            </dl>
          </article>
        </div>
      </template>
    </section>

    <AppFooter />
  </main>
</template>
