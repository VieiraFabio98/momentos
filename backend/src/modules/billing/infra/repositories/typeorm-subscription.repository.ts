import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ISubscription } from '../../domain/entities/i-subscription'
import { ISubscriptionRepository } from '../../domain/repositories/i-subscription-repository'
import {
  ICreateSubscriptionData,
  IUpdateSubscriptionData,
} from '../../domain/repositories/i-subscription-write-repository'
import { SubscriptionEntity } from '../entities/subscription.entity'

@Injectable()
export class TypeormSubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  findById(id: string): Promise<ISubscription | null> {
    return this.repository.findOneBy({ id })
  }

  findLatestByUserId(userId: string): Promise<ISubscription | null> {
    return this.repository.findOne({ where: { userId }, order: { createdAt: 'DESC' } })
  }

  findByProviderSubscriptionId(providerSubscriptionId: string): Promise<ISubscription | null> {
    return this.repository.findOneBy({ providerSubscriptionId })
  }

  create(data: ICreateSubscriptionData): Promise<ISubscription> {
    const subscription = this.repository.create(data)
    return this.repository.save(subscription)
  }

  async update(id: string, data: IUpdateSubscriptionData): Promise<ISubscription> {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    )
    await this.repository.update(id, cleaned)
    return this.repository.findOneByOrFail({ id })
  }
}
