export type SubscriptionPlan = 'mensal' | 'anual'

// admin = conta interna que cria eventos sem assinatura ativa (bypassa o gate de
// pagamento). user = conta comum (cerimonialista pagante).
export type UserRole = 'admin' | 'user'

export interface IUser {
  id: string
  name: string
  email: string
  passwordHash: string | null
  // plano de assinatura da cerimonialista; null enquanto não assinou. Sem gateway
  // por enquanto — escolher um plano só grava a escolha, sem cobrança.
  subscriptionPlan: SubscriptionPlan | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
