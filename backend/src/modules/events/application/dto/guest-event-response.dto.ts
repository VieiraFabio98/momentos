import { EventStatus, IEvent } from '../../domain/entities/i-event'

export class GuestEventResponseDto {
  title: string
  eventDate: string
  location: string
  status: EventStatus

  static fromDomain(event: IEvent): GuestEventResponseDto {
    const dto = new GuestEventResponseDto()
    dto.title = event.title
    dto.eventDate = event.eventDate
    dto.location = event.location
    dto.status = event.status
    return dto
  }
}
