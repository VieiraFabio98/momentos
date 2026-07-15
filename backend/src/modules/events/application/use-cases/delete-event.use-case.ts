import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, noContent, notFound } from '../../../../shared/helpers'
import { EVENT_REPOSITORY, IEventRepository } from '../../domain/repositories/i-event-repository'

@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }
    await this.eventRepository.delete(eventId)
    return noContent()
  }
}
