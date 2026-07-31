import { ISubscription, SubscriptionPlan, SubscriptionStatus } from '../../domain/entities/i-subscription'

// Resposta de "minha assinatura" para o front. Não expõe o providerSubscriptionId
// (id interno do gateway) — o front não precisa dele e não deve depender do MP.
export class SubscriptionResponseDto {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  createdAt: Date
  updatedAt: Date

  static fromDomain(subscription: ISubscription): SubscriptionResponseDto {
    const dto = new SubscriptionResponseDto()
    dto.id = subscription.id
    dto.plan = subscription.plan
    dto.status = subscription.status
    dto.currentPeriodEnd = subscription.currentPeriodEnd
    dto.createdAt = subscription.createdAt
    dto.updatedAt = subscription.updatedAt
    return dto
  }
}
