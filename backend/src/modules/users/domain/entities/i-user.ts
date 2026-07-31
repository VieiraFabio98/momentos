export type SubscriptionPlan = 'mensal' | 'anual'

// ciclo de vida de uma assinatura no gateway (Mercado Pago preapproval):
// pending = checkout criado, aguardando aprovação; active = pagando em dia;
// paused = cobrança falhou/suspensa; canceled = encerrada. O gate de criar
// evento só libera em `active`. Vive por completo no módulo billing; aqui é só
// o espelho lido rápido pelo front (evita join na tela).
export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'canceled'

// admin = conta interna que cria eventos sem assinatura ativa (bypassa o gate de
// pagamento). user = conta comum (cerimonialista pagante).
export type UserRole = 'admin' | 'user'

export interface IUser {
  id: string
  name: string
  email: string
  passwordHash: string | null
  // plano de assinatura da cerimonialista; null enquanto não assinou. Espelho
  // do módulo billing — dirigido pelo webhook do gateway, não pelo clique.
  subscriptionPlan: SubscriptionPlan | null
  // espelho do status da assinatura ativa; null enquanto nunca assinou. Fonte da
  // verdade é a tabela subscriptions — este campo é cache pro gate e pro front.
  subscriptionStatus: SubscriptionStatus | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
