import { Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { IEvent } from '../../domain/entities/i-event'
import {
  EVENT_REPOSITORY,
  IEventRepository,
} from '../../domain/repositories/i-event-repository'

export function buildDisplayUrl(event: IEvent): string {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  return `${frontendUrl}/telao/${event.displayToken}`
}

@Injectable()
export class GetDisplayLinkUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    return ok({ displayUrl: buildDisplayUrl(event) })
  }
}

@Injectable()
export class RotateDisplayTokenUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  // troca só o token do telão; o publicToken do QR impresso continua valendo
  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const updated = await this.eventRepository.update(eventId, {
      displayToken: randomBytes(16).toString('hex'),
    })

    return ok({ displayUrl: buildDisplayUrl(updated) })
  }
}
