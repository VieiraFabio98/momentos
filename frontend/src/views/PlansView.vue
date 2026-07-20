<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { ApiError } from '../services/api'
import { createEvent } from '../services/events'
import { useEventDraftStore, type PlanId } from '../stores/event-draft'

interface IPlan {
  id: PlanId
  name: string
  price: string
  priceNote: string
  highlight: boolean
  features: string[]
}

const plans: IPlan[] = [
  {
    id: 'degustacao',
    name: 'Degustação',
    price: 'Grátis',
    priceNote: 'para experimentar',
    highlight: false,
    features: ['30 fotos', 'Convidados ilimitados', 'Álbum disponível por 7 dias'],
  },
  {
    id: 'momento',
    name: 'Momento',
    price: 'R$ 29,90',
    priceNote: 'por evento',
    highlight: true,
    features: [
      'Fotos ilimitadas',
      'Convidados ilimitados',
      'Álbum por 6 meses',
      'Download de todas as fotos (ZIP)',
    ],
  },
  {
    id: 'memoria',
    name: 'Memória',
    price: 'R$ 350',
    priceNote: 'por evento',
    highlight: false,
    features: [
      'Tudo do plano Momento',
      'Álbum disponível por 2 anos',
      'Selecione 30 fotos e receba em casa',
      'Álbum físico no estilo polaroid',
    ],
  },
]

const draft = useEventDraftStore()
const router = useRouter()
const selected = ref<PlanId | null>(null)
const loading = ref(false)
const errorMessage = ref('')

function choosePlan(id: PlanId) {
  selected.value = id
  draft.plan = id
}

function buildWindow(): { opensAt?: string } {
  if (!draft.date || !draft.startTime) return {}
  const opens = new Date(`${draft.date}T${draft.startTime}`)
  return { opensAt: opens.toISOString() }
}

async function handleContinue() {
  if (!selected.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    await createEvent({
      title: draft.title,
      eventDate: draft.date,
      plan: selected.value,
      ...buildWindow(),
    })
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

    <section class="mx-auto max-w-5xl px-6 py-16">
      <header class="mb-12 text-center">
        <h2 class="font-display text-4xl font-medium text-stone-800">Escolha o plano</h2>
        <p class="mx-auto mt-3 max-w-md text-sm font-light text-stone-500">
          <template v-if="draft.title">Para “{{ draft.title }}” — </template>
          fotos ilimitadas dos seus convidados, do jeito que o grande dia merece
        </p>
      </header>

      <div class="grid gap-6 md:grid-cols-3">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex cursor-pointer flex-col rounded-2xl border bg-white p-8 transition"
          :class="[
            selected === plan.id
              ? 'border-champagne-500 ring-2 ring-champagne-300/40'
              : plan.highlight
                ? 'border-champagne-300'
                : 'border-stone-200 hover:border-champagne-300',
          ]"
          @click="choosePlan(plan.id)"
        >
          <span
            v-if="plan.highlight"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne-500 px-4 py-1 text-xs font-medium text-white"
          >
            Mais escolhido
          </span>

          <h3 class="font-display text-2xl font-medium text-stone-800">{{ plan.name }}</h3>
          <p class="mt-4">
            <span class="font-display text-4xl font-semibold text-stone-800">{{ plan.price }}</span>
            <span class="ml-1 text-xs text-stone-400">{{ plan.priceNote }}</span>
          </p>

          <ul class="mt-6 flex-1 space-y-3">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-2 text-sm text-stone-600"
            >
              <span class="mt-0.5 text-champagne-500">✦</span>
              {{ feature }}
            </li>
          </ul>

          <button
            type="button"
            class="mt-8 w-full rounded-lg py-3 text-sm font-medium tracking-wide transition"
            :class="
              selected === plan.id
                ? 'bg-champagne-500 text-white'
                : 'border border-champagne-400 text-champagne-600 hover:bg-champagne-500 hover:text-white'
            "
          >
            {{ selected === plan.id ? 'Selecionado' : 'Escolher' }}
          </button>
        </article>
      </div>

      <p
        v-if="errorMessage"
        class="mx-auto mt-8 max-w-md rounded-lg bg-red-50 px-4 py-3 text-center text-xs text-red-600"
      >
        {{ errorMessage }}
      </p>

      <div class="mt-12 flex justify-center gap-3">
        <button
          type="button"
          class="rounded-lg border border-stone-200 px-8 py-3 text-sm text-stone-600 transition hover:border-stone-300"
          @click="router.push({ name: 'event-create' })"
        >
          Voltar
        </button>
        <button
          type="button"
          :disabled="!selected || loading"
          class="rounded-lg bg-champagne-500 px-8 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleContinue"
        >
          {{ loading ? 'Criando…' : 'Continuar' }}
        </button>
      </div>
    </section>

    <AppFooter />
  </main>
</template>
