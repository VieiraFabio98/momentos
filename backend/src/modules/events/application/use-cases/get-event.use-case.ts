import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../domain/repositories/i-event-read-repository'
import { EventResponseDto } from '../dto/event-response.dto'

@Injectable()
export class GetEventUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }
    return ok(EventResponseDto.fromDomain(event))
  }
}
