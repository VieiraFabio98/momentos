import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, ok } from '../../../../shared/helpers'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../domain/repositories/i-event-read-repository'
import { EventResponseDto } from '../dto/event-response.dto'

@Injectable()
export class ListMyEventsUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
  ) {}

  async execute(userId: string): Promise<HttpResponse> {
    const events = await this.eventReadRepository.findAllByUserId(userId)
    return ok(events.map(EventResponseDto.fromDomain))
  }
}
