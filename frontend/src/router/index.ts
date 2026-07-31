import { createRouter, createWebHistory } from 'vue-router'
import { getStoredToken } from '../stores/auth'
import LoginView from '../views/LoginView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/perfil',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/events/new',
      name: 'event-create',
      component: () => import('../views/EventCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      // assinatura da conta (mensal/anual) — não é mais passo de criar evento
      path: '/assinatura',
      name: 'subscription',
      component: () => import('../views/PlansView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: () => import('../views/EventDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/privacidade',
      name: 'privacy',
      component: () => import('../views/PrivacyView.vue'),
    },
    {
      // telão da festa: sem login, protegido pelo token secreto de exibição
      path: '/telao/:token',
      name: 'telao',
      component: () => import('../views/TelaoView.vue'),
    },
    {
      // álbum curado do casal: sem login, protegido pelo albumToken que a
      // cerimonialista libera (e pode revogar) depois de curar as fotos
      path: '/album/:token',
      name: 'album',
      component: () => import('../views/AlbumView.vue'),
    },
    {
      path: '/e/:token',
      name: 'guest-landing',
      component: () => import('../views/GuestLandingView.vue'),
    },
    {
      path: '/e/:token/camera',
      name: 'guest-camera',
      component: () => import('../views/GuestCameraView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const hasToken = getStoredToken() !== null

  if (to.meta.requiresAuth && !hasToken) {
    return { name: 'login' }
  }
  if (to.name === 'login' && hasToken) {
    return { name: 'dashboard' }
  }
})

// Deploy novo troca o hash dos chunks lazy; uma aba aberta antes do deploy tenta
// buscar o chunk antigo (já removido) e o import dinâmico falha. Recarrega uma vez
// para pegar o index novo — a flag em sessionStorage evita loop se o erro persistir.
router.onError((error, to) => {
  const isStaleChunk =
    /Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
      error.message,
    )
  if (!isStaleChunk) return

  const RELOAD_FLAG = 'momentos.chunk-reload'
  if (sessionStorage.getItem(RELOAD_FLAG)) {
    sessionStorage.removeItem(RELOAD_FLAG)
    return
  }
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.assign(to.fullPath)
})
