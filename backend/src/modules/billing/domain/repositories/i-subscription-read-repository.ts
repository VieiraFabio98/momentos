import { ISubscription } from '../entities/i-subscription'

export const SUBSCRIPTION_READ_REPOSITORY = Symbol('SUBSCRIPTION_READ_REPOSITORY')

export interface ISubscriptionReadRepository {
  findById(id: string): Promise<ISubscription | null>
  // assinatura mais recente da conta (só existe uma viva por vez); usada pelo
  // gate e pela tela "minha assinatura".
  findLatestByUserId(userId: string): Promise<ISubscription | null>
  // ponto de entrada do webhook: o MP manda o id do preapproval, não o do user.
  findByProviderSubscriptionId(providerSubscriptionId: string): Promise<ISubscription | null>
}
