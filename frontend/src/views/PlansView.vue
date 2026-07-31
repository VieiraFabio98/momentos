<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { ApiError } from '../services/api'
import type { SubscriptionPlan } from '../services/auth'
import { useAuthStore } from '../stores/auth'

interface IPlan {
  id: SubscriptionPlan
  name: string
  price: string
  priceNote: string
  highlight: boolean
  features: string[]
}

const plans: IPlan[] = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 'R$ 49,99',
    priceNote: 'por mês',
    highlight: false,
    features: [
      'Eventos ilimitados',
      'Fotos e convidados ilimitados',
      'Álbum curado entregue ao casal',
      'Telão ao vivo na festa',
      'Pode congelar na baixa temporada',
    ],
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 'R$ 499',
    priceNote: 'por ano · 2 meses grátis',
    highlight: true,
    features: [
      'Tudo do plano Mensal',
      'Economia de ~2 mensalidades',
      'Preço travado pelo ano todo',
      'Ideal para quem trabalha o ano inteiro',
    ],
  },
]

const auth = useAuthStore()
const router = useRouter()

const currentPlan = computed(() => auth.user?.subscriptionPlan ?? null)
const selected = ref<SubscriptionPlan | null>(currentPlan.value)
const loading = ref(false)
const errorMessage = ref('')

// carrossel (só mobile): 1 card por vez + setas. activeIndex vem do scroll.
const scroller = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

function onScroll() {
  const el = scroller.value
  if (!el) return
  activeIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}

function goTo(index: number) {
  const el = scroller.value
  if (!el) return
  const clamped = Math.max(0, Math.min(index, plans.length - 1))
  el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
}

// abre já no plano em destaque (anual) se nenhum estiver escolhido
onMounted(async () => {
  const start = plans.findIndex((p) => p.id === (currentPlan.value ?? 'anual'))
  if (start > 0) {
    await nextTick()
    scroller.value?.scrollTo({ left: start * scroller.value.clientWidth })
    activeIndex.value = start
  }
})

async function handleSubscribe() {
  if (!selected.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    // sem gateway: só grava a escolha na conta
    await auth.subscribe(selected.value)
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

    <section class="mx-auto max-w-4xl px-6 py-16">
      <header class="mb-12 text-center">
        <h2 class="font-display text-4xl font-medium text-stone-800">Sua assinatura</h2>
        <p class="mx-auto mt-3 max-w-md text-sm font-light text-stone-500">
          Uma assinatura, eventos ilimitados. Escolha como prefere pagar.
        </p>
        <p
          v-if="currentPlan"
          class="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700"
        >
          <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
          Plano atual: {{ currentPlan === 'mensal' ? 'Mensal' : 'Anual' }}
        </p>
      </header>

      <div class="relative">
      <div
        ref="scroller"
        class="hide-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:gap-6 md:overflow-visible md:px-0 md:pb-0"
        @scroll.passive="onScroll"
      >
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex w-full shrink-0 cursor-pointer snap-center flex-col rounded-2xl border bg-white p-8 transition md:w-auto md:flex-1 md:shrink"
          :class="[
            selected === plan.id
              ? 'border-champagne-500 ring-2 ring-champagne-300/40'
              : plan.highlight
                ? 'border-champagne-300'
                : 'border-stone-200 hover:border-champagne-300',
          ]"
          @click="selected = plan.id"
        >
          <span
            v-if="plan.highlight"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne-500 px-4 py-1 text-xs font-medium text-white"
          >
            Melhor custo
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

        <!-- seta anterior (só mobile) -->
        <button
          v-show="activeIndex > 0"
          type="button"
          aria-label="Plano anterior"
          class="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-600 shadow-md backdrop-blur transition hover:text-champagne-600 md:hidden"
          @click="goTo(activeIndex - 1)"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 5l-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <!-- seta próximo (só mobile) -->
        <button
          v-show="activeIndex < plans.length - 1"
          type="button"
          aria-label="Próximo plano"
          class="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-600 shadow-md backdrop-blur transition hover:text-champagne-600 md:hidden"
          @click="goTo(activeIndex + 1)"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- indicadores (só mobile) -->
      <div class="mt-4 flex justify-center gap-2 md:hidden">
        <button
          v-for="(plan, i) in plans"
          :key="plan.id"
          type="button"
          :aria-label="`Ir para ${plan.name}`"
          class="h-2 rounded-full transition-all"
          :class="i === activeIndex ? 'w-6 bg-champagne-500' : 'w-2 bg-stone-300'"
          @click="goTo(i)"
        />
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
          @click="router.push({ name: 'dashboard' })"
        >
          Voltar
        </button>
        <button
          type="button"
          :disabled="!selected || selected === currentPlan || loading"
          class="rounded-lg bg-champagne-500 px-8 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleSubscribe"
        >
          {{ loading ? 'Salvando…' : currentPlan ? 'Trocar plano' : 'Assinar' }}
        </button>
      </div>
    </section>

    <AppFooter />
  </main>
</template>

<style scoped>
/* esconde a barra de rolagem do carrossel (mobile) sem perder o scroll/swipe */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
