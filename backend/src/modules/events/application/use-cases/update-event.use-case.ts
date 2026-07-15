import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { EVENT_REPOSITORY, IEventRepository } from '../../domain/repositories/i-event-repository'
import { EventResponseDto } from '../dto/event-response.dto'
import { UpdateEventDto } from '../dto/update-event.dto'

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

    const updated = await this.eventRepository.update(eventId, {
      title: dto.title,
      eventDate: dto.eventDate,
      location: dto.location,
      plan: dto.plan,
    })

    return ok(EventResponseDto.fromDomain(updated))
  }
}
