import { EventStatus, IEvent } from '../../domain/entities/i-event'

export class EventResponseDto {
  id: string
  title: string
  eventDate: string
  publicToken: string
  status: EventStatus
  opensAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date

  static fromDomain(event: IEvent): EventResponseDto {
    const dto = new EventResponseDto()
    dto.id = event.id
    dto.title = event.title
    dto.eventDate = event.eventDate
    dto.publicToken = event.publicToken
    dto.status = event.status
    dto.opensAt = event.opensAt
    dto.expiresAt = event.expiresAt
    dto.createdAt = event.createdAt
    dto.updatedAt = event.updatedAt
    return dto
  }
}
