<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { useEventDraftStore } from '../stores/event-draft'

const draft = useEventDraftStore()
const router = useRouter()

const today = computed(() => new Date().toISOString().split('T')[0])

function handleSubmit() {
  router.push({ name: 'plans' })
}
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-16 font-sans">
    <AppHeader />

    <section class="mx-auto max-w-xl px-6 py-16">
      <header class="mb-10 text-center">
        <h2 class="font-display text-4xl font-medium text-stone-800">Criar evento</h2>
        <p class="mx-auto mt-3 max-w-md text-sm font-light text-stone-500">
          Conte um pouco sobre o grande dia — depois é só escolher o plano e imprimir o QR Code
        </p>
      </header>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label for="title" class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600">
            Nome do evento
          </label>
          <input
            id="title"
            v-model="draft.title"
            type="text"
            required
            placeholder="Casamento de Ana & João"
            class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
          />
        </div>

        <div>
          <label for="date" class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600">
            Data
          </label>
          <input
            id="date"
            v-model="draft.date"
            type="date"
            required
            :min="today"
            class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
          />
        </div>

        <div>
          <label
            for="location"
            class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
          >
            Local
          </label>
          <input
            id="location"
            v-model="draft.location"
            type="text"
            required
            placeholder="Espaço Jardim das Flores, São Paulo"
            class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
          />
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="button"
            class="flex-1 rounded-lg border border-stone-200 py-3 text-sm text-stone-600 transition hover:border-stone-300"
            @click="router.push({ name: 'dashboard' })"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 rounded-lg bg-champagne-500 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
          >
            Continuar
          </button>
        </div>
      </form>
    </section>

    <AppFooter />
  </main>
</template>
