import { Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { badRequest, created, HttpResponse } from '../../../../shared/helpers'
import {
  EVENT_WRITE_REPOSITORY,
  IEventWriteRepository,
} from '../../domain/repositories/i-event-write-repository'
import { normalizeEventWindow } from '../../domain/services/event-window'
import { CreateEventDto } from '../dto/create-event.dto'
import { EventResponseDto } from '../dto/event-response.dto'

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(EVENT_WRITE_REPOSITORY)
    private readonly eventWriteRepository: IEventWriteRepository,
  ) {}

  async execute(userId: string, dto: CreateEventDto): Promise<HttpResponse> {
    const { opensAt, expiresAt } = normalizeEventWindow(
      dto.opensAt ? new Date(dto.opensAt) : null,
      dto.expiresAt ? new Date(dto.expiresAt) : null,
    )
    if (opensAt && expiresAt && opensAt >= expiresAt) {
      return badRequest('A liberação deve ser antes do encerramento')
    }

    const event = await this.eventWriteRepository.create({
      userId,
      title: dto.title,
      eventDate: dto.eventDate,
      location: dto.location,
      plan: dto.plan,
      publicToken: randomBytes(16).toString('hex'),
      opensAt,
      expiresAt,
    })

    return created(EventResponseDto.fromDomain(event))
  }
}
