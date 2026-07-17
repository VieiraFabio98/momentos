import { EventStatus, IEvent } from '../../domain/entities/i-event'
import { EventWindowState, getEventWindowState } from '../../domain/services/event-window'

export class GuestEventResponseDto {
  title: string
  eventDate: string
  status: EventStatus
  windowState: EventWindowState
  opensAt: Date | null

  static fromDomain(event: IEvent): GuestEventResponseDto {
    const dto = new GuestEventResponseDto()
    dto.title = event.title
    dto.eventDate = event.eventDate
    dto.status = event.status
    dto.windowState = getEventWindowState(event)
    dto.opensAt = event.opensAt
    return dto
  }
}
