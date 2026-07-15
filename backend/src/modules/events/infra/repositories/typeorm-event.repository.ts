import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IEvent } from '../../domain/entities/i-event'
import { IEventRepository } from '../../domain/repositories/i-event-repository'
import {
  ICreateEventData,
  IUpdateEventData,
} from '../../domain/repositories/i-event-write-repository'
import { EventEntity } from '../entities/event.entity'

@Injectable()
export class TypeormEventRepository implements IEventRepository {
  constructor(
    @InjectRepository(EventEntity)
    private readonly repository: Repository<EventEntity>,
  ) {}

  findAllByUserId(userId: string): Promise<IEvent[]> {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } })
  }

  findById(id: string): Promise<IEvent | null> {
    return this.repository.findOneBy({ id })
  }

  findByPublicToken(publicToken: string): Promise<IEvent | null> {
    return this.repository.findOneBy({ publicToken })
  }

  create(data: ICreateEventData): Promise<IEvent> {
    const event = this.repository.create(data)
    return this.repository.save(event)
  }

  async update(id: string, data: IUpdateEventData): Promise<IEvent> {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    )
    await this.repository.update(id, cleaned)
    return this.repository.findOneByOrFail({ id })
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}
