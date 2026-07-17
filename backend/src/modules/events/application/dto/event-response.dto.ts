import { EventPlan, EventStatus, IEvent } from '../../domain/entities/i-event'

export class EventResponseDto {
  id: string
  title: string
  eventDate: string
  location: string
  publicToken: string
  plan: EventPlan
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
    dto.location = event.location
    dto.publicToken = event.publicToken
    dto.plan = event.plan
    dto.status = event.status
    dto.opensAt = event.opensAt
    dto.expiresAt = event.expiresAt
    dto.createdAt = event.createdAt
    dto.updatedAt = event.updatedAt
    return dto
  }
}
