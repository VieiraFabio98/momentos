export type SubscriptionPlan = 'mensal' | 'anual'

export interface IUser {
  id: string
  name: string
  email: string
  passwordHash: string | null
  // plano de assinatura da cerimonialista; null enquanto não assinou. Sem gateway
  // por enquanto — escolher um plano só grava a escolha, sem cobrança.
  subscriptionPlan: SubscriptionPlan | null
  createdAt: Date
  updatedAt: Date
}
