import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../domain/repositories/i-event-read-repository'
import { GuestEventResponseDto } from '../dto/guest-event-response.dto'

@Injectable()
export class GetEventByPublicTokenUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
  ) {}

  async execute(publicToken: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findByPublicToken(publicToken)
    if (!event) {
      return notFound('Evento não encontrado')
    }
    return ok(GuestEventResponseDto.fromDomain(event))
  }
}
