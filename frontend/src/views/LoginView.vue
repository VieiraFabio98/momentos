<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLoader from '../components/AppLoader.vue'
import { useGoogleSignin } from '../composables/use-google-signin'
import { useUnsplashImage } from '../composables/use-unsplash-image'
import { ApiError } from '../services/api'
import { registerUser, requestPasswordRecovery } from '../services/auth'
import { useAuthStore } from '../stores/auth'

type Mode = 'login' | 'register' | 'forgot'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<Mode>('login')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const { imageUrl, credit } = useUnsplashImage()

const googleButtonRef = ref<HTMLElement | null>(null)
const { available: googleAvailable } = useGoogleSignin(googleButtonRef, async (idToken) => {
  errorMessage.value = ''
  loading.value = true
  try {
    await auth.loginWithGoogle(idToken)
    await router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Não foi possível conectar ao servidor'
  } finally {
    loading.value = false
  }
})

const loadingLabel = computed(() => {
  if (mode.value === 'register') return 'Criando sua conta…'
  if (mode.value === 'forgot') return 'Enviando link…'
  return 'Entrando…'
})

const title = computed(() => {
  if (mode.value === 'register') return 'Criar conta'
  if (mode.value === 'forgot') return 'Recuperar senha'
  return 'Bem-vindo'
})

const subtitle = computed(() => {
  if (mode.value === 'register') return 'Comece a guardar os momentos do seu grande dia'
  if (mode.value === 'forgot') return 'Enviaremos um link de recuperação para o seu e-mail'
  return 'Entre para reviver cada momento'
})

function switchMode(next: Mode) {
  mode.value = next
  errorMessage.value = ''
  successMessage.value = ''
}

async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (mode.value === 'register') {
      await registerUser({ name: form.name, email: form.email, password: form.password })
      switchMode('login')
      successMessage.value = 'Conta criada com sucesso! Faça login para continuar.'
    } else if (mode.value === 'forgot') {
      await requestPasswordRecovery(form.email)
      successMessage.value = 'Se o e-mail existir, você receberá um link de recuperação.'
    } else {
      await auth.login(form.email, form.password)
      await router.push({ name: 'dashboard' })
    }
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value =
        error.status === 404 && mode.value !== 'register'
          ? 'Funcionalidade ainda não disponível no servidor'
          : error.message
    } else {
      errorMessage.value = 'Não foi possível conectar ao servidor'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen bg-ivory-50 font-sans">
    <!-- 65% — imagem -->
    <section class="relative hidden overflow-hidden lg:block lg:w-[65%]">
      <img
        :src="imageUrl"
        alt="Noiva sorrindo"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-black/20" />

      <div class="absolute inset-x-0 bottom-0 p-12 text-white">
        <h1 class="font-display text-5xl font-medium tracking-wide">Momentos</h1>
        <p class="mt-3 max-w-md font-display text-2xl italic text-white/90">
          Cada olhar dos seus convidados guarda uma lembrança do seu grande dia
        </p>
        <a
          v-if="credit"
          :href="credit.link"
          target="_blank"
          rel="noopener"
          class="mt-6 inline-block text-xs text-white/50 hover:text-white/80"
        >
          Foto de {{ credit.name }} no Unsplash
        </a>
      </div>
    </section>

    <!-- 35% — formulário -->
    <section class="flex w-full items-center justify-center px-6 py-12 lg:w-[35%] lg:px-12">
      <div class="w-full max-w-sm">
        <header class="mb-10 text-center">
          <h1 class="font-display text-4xl font-semibold text-stone-800 lg:hidden">Momentos</h1>
          <div class="mx-auto mt-4 mb-8 h-px w-16 bg-champagne-400 lg:hidden" />
          <h2 class="font-display text-3xl font-medium text-stone-800">{{ title }}</h2>
          <p class="mt-2 text-sm font-light text-stone-500">{{ subtitle }}</p>
        </header>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'">
            <label for="name" class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600">
              Nome
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="Seu nome"
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
            />
          </div>

          <div>
            <label
              for="email"
              class="mb-1.5 block text-xs font-medium tracking-wide text-stone-600"
            >
              E-mail
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="voce@exemplo.com"
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
            />
          </div>

          <div v-if="mode !== 'forgot'">
            <div class="mb-1.5 flex items-center justify-between">
              <label for="password" class="block text-xs font-medium tracking-wide text-stone-600">
                Senha
              </label>
              <button
                v-if="mode === 'login'"
                type="button"
                class="text-xs text-champagne-600 hover:text-champagne-500"
                @click="switchMode('forgot')"
              >
                Esqueceu a senha?
              </button>
            </div>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="6"
              placeholder="••••••••"
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30"
            />
          </div>

          <p v-if="errorMessage" class="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
            {{ errorMessage }}
          </p>
          <p
            v-if="successMessage"
            class="rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
          >
            {{ successMessage }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-champagne-500 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="mode === 'register'">Criar conta</span>
            <span v-else-if="mode === 'forgot'">Enviar link</span>
            <span v-else>Entrar</span>
          </button>
        </form>

        <div v-show="googleAvailable && mode !== 'forgot'" class="mt-6">
          <div class="mb-6 flex items-center gap-4">
            <div class="h-px flex-1 bg-stone-200" />
            <span class="text-xs text-stone-400">ou</span>
            <div class="h-px flex-1 bg-stone-200" />
          </div>
          <div ref="googleButtonRef" class="flex justify-center" />
        </div>

        <footer class="mt-8 text-center text-sm text-stone-500">
          <template v-if="mode === 'login'">
            Ainda não tem conta?
            <button
              class="font-medium text-champagne-600 hover:text-champagne-500"
              @click="switchMode('register')"
            >
              Criar conta
            </button>
          </template>
          <template v-else>
            <button
              class="font-medium text-champagne-600 hover:text-champagne-500"
              @click="switchMode('login')"
            >
              Voltar para o login
            </button>
          </template>
        </footer>
      </div>
    </section>

    <!-- overlay de loading -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="loading"
        class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 backdrop-blur-sm"
      >
        <div class="rounded-2xl bg-white px-12 py-10 shadow-xl">
          <AppLoader :label="loadingLabel" class="py-0!" />
        </div>
      </div>
    </Transition>
  </main>
</template>
