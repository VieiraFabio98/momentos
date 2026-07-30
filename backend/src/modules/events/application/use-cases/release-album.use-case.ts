import { Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { IEvent } from '../../domain/entities/i-event'
import {
  EVENT_REPOSITORY,
  IEventRepository,
} from '../../domain/repositories/i-event-repository'

export function buildAlbumUrl(albumToken: string): string {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  return `${frontendUrl}/album/${albumToken}`
}

// o que o dono vê sobre o link do casal: liberado ou não, e a URL quando existe
function albumState(event: IEvent): HttpResponse {
  const released = event.albumReleasedAt !== null && event.albumToken !== null
  return ok({
    released,
    albumUrl: released ? buildAlbumUrl(event.albumToken!) : null,
    releasedAt: event.albumReleasedAt,
  })
}

@Injectable()
export class GetAlbumLinkUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    return albumState(event)
  }
}

@Injectable()
export class ReleaseAlbumUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  // libera o álbum curado ao casal. Idempotente: se já liberado, mantém o mesmo
  // link (re-liberar não gera token novo, para não invalidar o link já enviado).
  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const updated = await this.eventRepository.update(eventId, {
      albumToken: event.albumToken ?? randomBytes(16).toString('hex'),
      albumReleasedAt: event.albumReleasedAt ?? new Date(),
    })

    return albumState(updated)
  }
}

@Injectable()
export class RevokeAlbumUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  // derruba o link do casal de vez: zera token e liberação. Uma futura liberação
  // gera um token novo (link diferente), então um link vazado morre para sempre.
  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const updated = await this.eventRepository.update(eventId, {
      albumToken: null,
      albumReleasedAt: null,
    })

    return albumState(updated)
  }
}
