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
      path: '/events/new',
      name: 'event-create',
      component: () => import('../views/EventCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/events/new/plans',
      name: 'plans',
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
