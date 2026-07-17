import { Inject, Injectable } from '@nestjs/common'
import { badRequest, HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { EVENT_REPOSITORY, IEventRepository } from '../../domain/repositories/i-event-repository'
import { normalizeEventWindow } from '../../domain/services/event-window'
import { EventResponseDto } from '../dto/event-response.dto'
import { UpdateEventDto } from '../dto/update-event.dto'

function toDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined
  return value === null ? null : new Date(value)
}

@Injectable()
export class UpdateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(userId: string, eventId: string, dto: UpdateEventDto): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const opensAtInput = toDateOrNull(dto.opensAt)
    const expiresAtInput = toDateOrNull(dto.expiresAt)

    let opensAt = opensAtInput
    let expiresAt = expiresAtInput
    if (opensAtInput !== undefined || expiresAtInput !== undefined) {
      const normalized = normalizeEventWindow(
        opensAtInput === undefined ? event.opensAt : opensAtInput,
        expiresAtInput === undefined ? event.expiresAt : expiresAtInput,
      )
      opensAt = normalized.opensAt
      expiresAt = normalized.expiresAt
      if (opensAt && expiresAt && opensAt >= expiresAt) {
        return badRequest('A liberação deve ser antes do encerramento')
      }
    }

    const updated = await this.eventRepository.update(eventId, {
      title: dto.title,
      eventDate: dto.eventDate,
      location: dto.location,
      plan: dto.plan,
      opensAt,
      expiresAt,
    })

    return ok(EventResponseDto.fromDomain(updated))
  }
}
