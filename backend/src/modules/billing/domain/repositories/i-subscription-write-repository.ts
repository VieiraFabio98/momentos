import { ISubscription, SubscriptionPlan, SubscriptionStatus } from '../entities/i-subscription'

export const SUBSCRIPTION_WRITE_REPOSITORY = Symbol('SUBSCRIPTION_WRITE_REPOSITORY')

export interface ICreateSubscriptionData {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  providerSubscriptionId: string
  currentPeriodEnd?: Date | null
}

export interface IUpdateSubscriptionData {
  plan?: SubscriptionPlan
  status?: SubscriptionStatus
  currentPeriodEnd?: Date | null
}

export interface ISubscriptionWriteRepository {
  create(data: ICreateSubscriptionData): Promise<ISubscription>
  update(id: string, data: IUpdateSubscriptionData): Promise<ISubscription>
}
