<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { getMySubscription } from '../services/billing'
import { useAuthStore } from '../stores/auth'

// 'checking' enquanto faz poll; 'active' quando o webhook confirmou o pagamento;
// 'pending' se estourou o tempo sem confirmar (pagamento pode cair depois);
// 'canceled' se o gateway recusou/cancelou.
type ViewState = 'checking' | 'active' | 'pending' | 'canceled'

const router = useRouter()
const auth = useAuthStore()

const state = ref<ViewState>('checking')

// poll: o webhook pode levar alguns segundos após o redirect. Tenta por ~24s
// (12 × 2s) antes de cair no estado "pendente".
const MAX_ATTEMPTS = 12
const INTERVAL_MS = 2000
let cancelled = false
let timer: ReturnType<typeof setTimeout> | null = null

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    timer = setTimeout(resolve, ms)
  })
}

async function poll() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (cancelled) return

    try {
      const subscription = await getMySubscription()
      if (subscription?.status === 'active') {
        // espelho da conta atualizado (badge de plano, gate de criar evento)
        await auth.fetchMe().catch(() => {})
        state.value = 'active'
        return
      }
      if (subscription?.status === 'canceled' || subscription?.status === 'paused') {
        state.value = 'canceled'
        return
      }
    } catch {
      // erro transitório de rede: ignora e tenta de novo no próximo ciclo
    }

    await sleep(INTERVAL_MS)
  }

  // esgotou as tentativas ainda em 'pending'
  if (!cancelled) state.value = 'pending'
}

onMounted(poll)

onUnmounted(() => {
  cancelled = true
  if (timer) clearTimeout(timer)
})

function goToDashboard() {
  router.push({ name: 'dashboard' })
}

function goToPlans() {
  router.push({ name: 'subscription' })
}
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-16 font-sans">
    <AppHeader />

    <section class="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <!-- verificando pagamento -->
      <template v-if="state === 'checking'">
        <div
          class="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-champagne-200 border-t-champagne-500"
        ></div>
        <h2 class="font-display text-3xl font-medium text-stone-800">Confirmando pagamento…</h2>
        <p class="mt-3 text-sm font-light text-stone-500">
          Estamos confirmando sua assinatura com o Mercado Pago. Leva só alguns segundos.
        </p>
      </template>

      <!-- assinatura ativa -->
      <template v-else-if="state === 'active'">
        <div
          class="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600"
        >
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h2 class="font-display text-3xl font-medium text-stone-800">Assinatura ativa!</h2>
        <p class="mt-3 text-sm font-light text-stone-500">
          Tudo certo. Agora você já pode criar eventos ilimitados no Momentos.
        </p>
        <button
          type="button"
          class="mt-8 rounded-lg bg-champagne-500 px-8 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
          @click="goToDashboard"
        >
          Ir para o painel
        </button>
      </template>

      <!-- pagamento pendente (poll estourou) -->
      <template v-else-if="state === 'pending'">
        <div
          class="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600"
        >
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h2 class="font-display text-3xl font-medium text-stone-800">Quase lá</h2>
        <p class="mt-3 text-sm font-light text-stone-500">
          O pagamento ainda está sendo processado pelo Mercado Pago. Assim que for confirmado, sua
          assinatura é ativada automaticamente — pode conferir no painel em instantes.
        </p>
        <button
          type="button"
          class="mt-8 rounded-lg bg-champagne-500 px-8 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
          @click="goToDashboard"
        >
          Ir para o painel
        </button>
      </template>

      <!-- recusado / cancelado -->
      <template v-else>
        <div
          class="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"
        >
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h2 class="font-display text-3xl font-medium text-stone-800">Não foi possível assinar</h2>
        <p class="mt-3 text-sm font-light text-stone-500">
          O pagamento não foi concluído. Você pode tentar de novo quando quiser.
        </p>
        <button
          type="button"
          class="mt-8 rounded-lg bg-champagne-500 px-8 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
          @click="goToPlans"
        >
          Tentar de novo
        </button>
      </template>
    </section>

    <AppFooter />
  </main>
</template>
