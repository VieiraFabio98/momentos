import { ISubscriptionReadRepository } from './i-subscription-read-repository'
import { ISubscriptionWriteRepository } from './i-subscription-write-repository'

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY')

export interface ISubscriptionRepository
  extends ISubscriptionReadRepository,
    ISubscriptionWriteRepository {}
