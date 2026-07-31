<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import AppLoader from '../components/AppLoader.vue'
import { ApiError } from '../services/api'
import { requestPasswordRecovery } from '../services/auth'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(true)

const name = ref('')
const savingData = ref(false)
const dataError = ref('')
const dataSuccess = ref('')

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

const recoverySending = ref(false)
const recoveryMessage = ref('')

// conta criada pelo Google ainda não tem senha: não há o que conferir, e a
// seção de senha vira "criar senha" em vez de "alterar senha"
const hasPassword = computed(() => auth.user?.hasPassword ?? true)
const nameChanged = computed(() => name.value.trim() !== (auth.user?.name ?? ''))
const currentPlan = computed(() => auth.user?.subscriptionPlan ?? null)

function resetDataForm() {
  name.value = auth.user?.name ?? ''
}

function handleUnauthorized() {
  auth.logout()
  router.push({ name: 'login' })
}

onMounted(async () => {
  try {
    if (!auth.user) {
      await auth.fetchMe()
    }
    resetDataForm()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      handleUnauthorized()
      return
    }
    dataError.value = 'Não foi possível carregar seus dados'
  } finally {
    loading.value = false
  }
})

// mensagem de sucesso não pode ficar pendurada sobre um formulário já mexido de
// novo: quem lê "Dados atualizados" enquanto digita acha que salvou sozinho
watch(name, () => {
  dataSuccess.value = ''
  dataError.value = ''
})

watch([currentPassword, newPassword, confirmPassword], () => {
  passwordSuccess.value = ''
  passwordError.value = ''
})

async function saveData() {
  dataError.value = ''
  dataSuccess.value = ''

  if (!nameChanged.value) {
    dataError.value = 'Nada foi alterado'
    return
  }

  savingData.value = true
  try {
    await auth.updateProfile({ name: name.value.trim() })
    dataSuccess.value = 'Dados atualizados'
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      handleUnauthorized()
      return
    }
    dataError.value =
      error instanceof ApiError ? error.message : 'Não foi possível conectar ao servidor'
  } finally {
    savingData.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'As senhas não conferem'
    return
  }

  savingPassword.value = true
  try {
    await auth.updateProfile({
      password: newPassword.value,
      ...(hasPassword.value ? { currentPassword: currentPassword.value } : {}),
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    // esvaziar os campos dispara o watch que limpa mensagens; só depois dele
    // passar é que o sucesso pode ser anunciado, senão ele próprio é apagado
    await nextTick()
    passwordSuccess.value = 'Senha alterada'
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      handleUnauthorized()
      return
    }
    passwordError.value =
      error instanceof ApiError ? error.message : 'Não foi possível conectar ao servidor'
  } finally {
    savingPassword.value = false
  }
}

// para quem não lembra a senha atual: o link de redefinição vai para o e-mail
// já cadastrado, nunca para o que estiver digitado no formulário acima
async function sendRecovery() {
  const savedEmail = auth.user?.email
  if (!savedEmail) return

  recoveryMessage.value = ''
  recoverySending.value = true
  try {
    await requestPasswordRecovery(savedEmail)
    recoveryMessage.value = `Link enviado para ${savedEmail}. Ele vale por 30 minutos.`
  } catch {
    recoveryMessage.value = 'Não foi possível enviar o e-mail agora. Tente de novo em instantes.'
  } finally {
    recoverySending.value = false
  }
}

const inputClasses =
  'w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30'
const labelClasses = 'mb-1.5 block text-xs font-medium tracking-wide text-stone-600'
</script>

<template>
  <main class="min-h-screen bg-ivory-50 pb-24 font-sans">
    <AppHeader />

    <section class="mx-auto max-w-2xl px-6 py-16">
      <AppLoader v-if="loading" label="Carregando sua conta…" />

      <template v-else>
        <button
          type="button"
          class="text-xs text-champagne-600 underline underline-offset-2"
          @click="router.push({ name: 'dashboard' })"
        >
          ← Voltar
        </button>

        <h2 class="mt-6 font-display text-4xl font-medium text-stone-800">Sua conta</h2>
        <div class="mt-4 mb-10 h-px w-16 bg-champagne-400" />

        <!-- dados da conta -->
        <form
          class="rounded-2xl border border-stone-200 bg-white p-8"
          @submit.prevent="saveData"
        >
          <h3 class="font-display text-2xl font-medium text-stone-800">Seus dados</h3>
          <p class="mt-1 text-sm font-light text-stone-500">
            É para este e-mail que enviamos avisos e o link de recuperação de senha.
          </p>

          <div class="mt-6 space-y-4">
            <div>
              <label for="profile-name" :class="labelClasses">Nome</label>
              <input
                id="profile-name"
                v-model="name"
                type="text"
                required
                autocomplete="name"
                :class="inputClasses"
              />
            </div>

            <div>
              <label for="profile-email" :class="labelClasses">E-mail</label>
              <input
                id="profile-email"
                :value="auth.user?.email"
                type="email"
                readonly
                disabled
                autocomplete="email"
                :class="[inputClasses, 'cursor-not-allowed bg-stone-50 text-stone-400']"
              />
              <p class="mt-1.5 text-xs font-light text-stone-500">
                O e-mail não pode ser alterado — é por ele que enviamos avisos e recuperação de senha.
              </p>
            </div>
          </div>

          <p v-if="dataError" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
            {{ dataError }}
          </p>
          <p
            v-if="dataSuccess"
            class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
          >
            {{ dataSuccess }}
          </p>

          <div class="mt-8 flex gap-3">
            <button
              type="button"
              :disabled="savingData || !nameChanged"
              class="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
              @click="resetDataForm"
            >
              Desfazer
            </button>
            <button
              type="submit"
              :disabled="savingData || !nameChanged"
              class="flex-1 rounded-lg bg-champagne-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ savingData ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        </form>

        <!-- senha -->
        <form
          class="mt-8 rounded-2xl border border-stone-200 bg-white p-8"
          @submit.prevent="savePassword"
        >
          <h3 class="font-display text-2xl font-medium text-stone-800">
            {{ hasPassword ? 'Alterar senha' : 'Criar senha' }}
          </h3>
          <p class="mt-1 text-sm font-light text-stone-500">
            {{
              hasPassword
                ? 'Você precisa saber a senha atual para trocá-la.'
                : 'Sua conta entra pelo Google. Crie uma senha se quiser também entrar por e-mail.'
            }}
          </p>

          <div class="mt-6 space-y-4">
            <div v-if="hasPassword">
              <label for="profile-current-password" :class="labelClasses">Senha atual</label>
              <input
                id="profile-current-password"
                v-model="currentPassword"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                :class="inputClasses"
              />
            </div>

            <div>
              <label for="profile-new-password" :class="labelClasses">Nova senha</label>
              <input
                id="profile-new-password"
                v-model="newPassword"
                type="password"
                required
                minlength="6"
                autocomplete="new-password"
                placeholder="mínimo de 6 caracteres"
                :class="inputClasses"
              />
            </div>

            <div>
              <label for="profile-confirm-password" :class="labelClasses">Confirmar nova senha</label>
              <input
                id="profile-confirm-password"
                v-model="confirmPassword"
                type="password"
                required
                minlength="6"
                autocomplete="new-password"
                placeholder="••••••••"
                :class="inputClasses"
              />
            </div>
          </div>

          <p
            v-if="passwordError"
            class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600"
          >
            {{ passwordError }}
          </p>
          <p
            v-if="passwordSuccess"
            class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
          >
            {{ passwordSuccess }}
          </p>

          <button
            type="submit"
            :disabled="savingPassword"
            class="mt-8 w-full rounded-lg bg-champagne-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ savingPassword ? 'Salvando…' : hasPassword ? 'Alterar senha' : 'Criar senha' }}
          </button>

          <div v-if="hasPassword" class="mt-6 border-t border-ivory-200 pt-6 text-center">
            <p class="text-sm font-light text-stone-500">Não lembra sua senha atual?</p>
            <button
              type="button"
              :disabled="recoverySending"
              class="mt-1 text-sm font-medium text-champagne-600 underline underline-offset-2 transition hover:text-champagne-500 disabled:opacity-60"
              @click="sendRecovery"
            >
              {{ recoverySending ? 'Enviando…' : 'Receber link por e-mail' }}
            </button>
            <p v-if="recoveryMessage" class="mt-3 text-xs font-light text-stone-500">
              {{ recoveryMessage }}
            </p>
          </div>
        </form>

        <!-- assinatura -->
        <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-display text-2xl font-medium text-stone-800">Assinatura</h3>
              <p class="mt-1 text-sm font-light text-stone-500">
                <template v-if="currentPlan">
                  Seu plano atual é
                  <span class="font-medium text-stone-700">{{
                    currentPlan === 'mensal' ? 'Mensal' : 'Anual'
                  }}</span
                  >.
                </template>
                <template v-else> Você ainda não tem um plano ativo. </template>
              </p>
            </div>
            <span
              v-if="currentPlan"
              class="inline-flex shrink-0 items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
            >
              <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              Ativo
            </span>
          </div>

          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-champagne-500 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-champagne-600"
            @click="router.push({ name: 'subscription' })"
          >
            {{ currentPlan ? 'Gerenciar assinatura' : 'Ver planos' }}
          </button>
        </div>
      </template>
    </section>

    <AppFooter />
  </main>
</template>
