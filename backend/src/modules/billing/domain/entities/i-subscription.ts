import { SubscriptionPlan, SubscriptionStatus } from '../../../users/domain/entities/i-user'

// Reexporta os tipos que vivem no domínio de users (o campo mora lá como espelho)
// para o resto do módulo billing importar de um lugar só.
export { SubscriptionPlan, SubscriptionStatus }

// Fonte da verdade da assinatura de uma cerimonialista. O gateway (Mercado Pago
// preapproval) é quem manda no ciclo de vida; esta linha é o reflexo local dele.
// O espelho em `users.subscription_status` existe só para o gate e o front lerem
// rápido, mas quem decide se pode criar evento é o `status` daqui.
export interface ISubscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  // id do preapproval no Mercado Pago; é a chave que o webhook usa para achar
  // esta linha ao receber uma notificação de mudança de status.
  providerSubscriptionId: string
  // fim do período pago atual (vem do MP); null enquanto ainda pending. Depois
  // desta data sem renovação, a assinatura deixa de valer.
  currentPeriodEnd: Date | null
  createdAt: Date
  updatedAt: Date
}
