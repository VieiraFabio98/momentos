import { Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { created, HttpResponse } from '../../../../shared/helpers'
import {
  EVENT_WRITE_REPOSITORY,
  IEventWriteRepository,
} from '../../domain/repositories/i-event-write-repository'
import { CreateEventDto } from '../dto/create-event.dto'
import { EventResponseDto } from '../dto/event-response.dto'

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(EVENT_WRITE_REPOSITORY)
    private readonly eventWriteRepository: IEventWriteRepository,
  ) {}

  async execute(userId: string, dto: CreateEventDto): Promise<HttpResponse> {
    const event = await this.eventWriteRepository.create({
      userId,
      title: dto.title,
      eventDate: dto.eventDate,
      location: dto.location,
      plan: dto.plan,
      publicToken: randomBytes(16).toString('hex'),
    })

    return created(EventResponseDto.fromDomain(event))
  }
}
