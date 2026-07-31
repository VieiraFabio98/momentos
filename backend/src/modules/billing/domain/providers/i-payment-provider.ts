import { SubscriptionPlan, SubscriptionStatus } from '../entities/i-subscription'

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER')

export interface ICreatePreapprovalInput {
  plan: SubscriptionPlan
  payerEmail: string
  // nossa referência (userId) devolvida pelo gateway nas notificações; é como o
  // webhook amarra o preapproval de volta à conta sem confiar só no id externo.
  externalReference: string
}

export interface ICreatePreapprovalResult {
  // id do preapproval no gateway — vira `providerSubscriptionId` na nossa linha
  providerSubscriptionId: string
  // URL do checkout do gateway; o front redireciona a cerimonialista para cá
  initPoint: string
}

// detalhes que o webhook lê ao buscar o preapproval no gateway. `status` já vem
// traduzido para o nosso vocabulário (pending|active|paused|canceled).
export interface IPreapprovalDetails {
  providerSubscriptionId: string
  status: SubscriptionStatus
  externalReference: string | null
  // fim do período pago atual (next_payment_date do MP); null se indisponível
  currentPeriodEnd: Date | null
}

// Abstrai o gateway de assinatura recorrente. O concreto (Mercado Pago) mora em
// infra; os use-cases só conhecem esta interface — trocar de gateway não toca no
// application.
// entradas cruas do request de webhook usadas para validar a autenticidade da
// notificação (assinatura HMAC do gateway).
export interface IVerifyNotificationInput {
  signature: string | undefined
  requestId: string | undefined
  dataId: string | undefined
}

export interface IPaymentProvider {
  createPreapproval(input: ICreatePreapprovalInput): Promise<ICreatePreapprovalResult>
  getPreapproval(providerSubscriptionId: string): Promise<IPreapprovalDetails | null>
  cancel(providerSubscriptionId: string): Promise<void>
  // true se a notificação é autêntica (ou se a validação está desligada em dev)
  verifyNotification(input: IVerifyNotificationInput): boolean
}
