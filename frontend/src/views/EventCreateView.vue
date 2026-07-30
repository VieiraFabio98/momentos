<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import TimeSelect from '../components/TimeSelect.vue'
import { ApiError } from '../services/api'
import { createEvent } from '../services/events'
import { useEventDraftStore } from '../stores/event-draft'

const draft = useEventDraftStore()
const router = useRouter()

const today = computed(() => new Date().toISOString().split('T')[0])

const loading = ref(false)
const errorMessage = ref('')

// plano deixou de ser por evento (virou assinatura da conta), então o evento é
// criado direto daqui, sem passo de escolha de plano
async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''
  try {
    const opensAt = new Date(`${draft.date}T${draft.startTime}`).toISOString()
    await createEvent({ title: draft.title, eventDate: draft.date, opensAt })
    draft.reset()
    router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Não foi possível conectar ao servidor'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-16 font-sans">
    <AppHeader />

    <section class="mx-auto max-w-xl px-6 py-16">
      <header class="mb-10 text-center">
        <h2 class="font-display text-4xl font-medium text-stone-800">Criar evento</h2>
        <p class="mx-auto mt-3 max-w-md text-sm font-light text-stone-500">
          Conte um pouco sobre o grande dia — depois é só imprimir o QR Code
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
            for="start-time"
            class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
          >
            Começa às
          </label>
          <TimeSelect id="start-time" v-model="draft.startTime" required :disabled="!draft.date" />
          <p class="mt-2 text-xs font-light text-stone-400">
            <template v-if="!draft.date">Escolha a data primeiro para definir o horário.</template>
            <template v-else>
              A partir desse horário, os convidados têm <strong>24 horas</strong> para enviar fotos.
            </template>
          </p>
        </div>

        <p
          v-if="errorMessage"
          class="rounded-lg bg-red-50 px-4 py-3 text-center text-xs text-red-600"
        >
          {{ errorMessage }}
        </p>

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
            :disabled="loading"
            class="flex-1 rounded-lg bg-champagne-500 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? 'Criando…' : 'Criar evento' }}
          </button>
        </div>
      </form>
    </section>

    <AppFooter />
  </main>
</template>
