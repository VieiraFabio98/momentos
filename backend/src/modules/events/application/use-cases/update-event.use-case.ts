import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { EVENT_REPOSITORY, IEventRepository } from '../../domain/repositories/i-event-repository'
import { deriveEventWindow } from '../../domain/services/event-window'
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

    let opensAt: Date | null | undefined
    let expiresAt: Date | null | undefined
    if (opensAtInput !== undefined) {
      const derived = deriveEventWindow(opensAtInput)
      opensAt = derived.opensAt
      expiresAt = derived.expiresAt
    }

    const updated = await this.eventRepository.update(eventId, {
      title: dto.title,
      eventDate: dto.eventDate,
      plan: dto.plan,
      opensAt,
      expiresAt,
    })

    return ok(EventResponseDto.fromDomain(updated))
  }
}
