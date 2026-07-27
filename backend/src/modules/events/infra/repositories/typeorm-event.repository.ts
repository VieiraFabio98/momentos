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

  findByDisplayToken(displayToken: string): Promise<IEvent | null> {
    return this.repository.findOneBy({ displayToken })
  }

  // O encerramento é o fim da janela de envios; quando o casal nunca definiu
  // uma janela, cai no fim do dia da festa — senão o álbum ficaria elegível
  // para sempre e nunca seria apagado. A diferença de fuso entre a meia-noite
  // UTC e a de Brasília é irrelevante diante dos 7 dias de folga.
  findPendingPhotoPurge(endedBefore: Date, limit: number): Promise<IEvent[]> {
    return this.repository
      .createQueryBuilder('event')
      .where('event.photos_purged_at IS NULL')
      .andWhere(
        `COALESCE(event.expires_at, event.event_date::timestamp + INTERVAL '1 day') < :endedBefore`,
        { endedBefore },
      )
      .orderBy('event.event_date', 'ASC')
      .limit(limit)
      .getMany()
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
