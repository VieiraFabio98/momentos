import { api } from './api'
import type { SubscriptionPlan } from './auth'

export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'canceled'

export interface ISubscriptionResponse {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  createdAt: string
  updatedAt: string
}

// preço vigente de cada plano (amount em reais), vindo do backend/.env — fonte
// única, o front não fixa valor
export interface IPlanPrice {
  plan: SubscriptionPlan
  amount: number
  frequency: number
  frequencyType: string
}

export function getPlans() {
  return api.get<IPlanPrice[]>('/billing/plans')
}

// inicia a assinatura no gateway e devolve a URL de checkout do Mercado Pago;
// a tela redireciona para ela
export function startSubscription(plan: SubscriptionPlan) {
  return api.post<{ initPoint: string }>('/billing/subscribe', { plan })
}

// assinatura mais recente da conta (ou null se nunca assinou); a tela de retorno
// faz poll disto até o status virar 'active' (webhook processado)
export function getMySubscription() {
  return api.get<ISubscriptionResponse | null>('/billing/me')
}

export function cancelSubscription() {
  return api.delete<ISubscriptionResponse>('/billing/me')
}
