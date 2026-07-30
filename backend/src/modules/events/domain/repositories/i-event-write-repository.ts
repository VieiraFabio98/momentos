import { EventStatus, IEvent } from '../entities/i-event'

export const EVENT_WRITE_REPOSITORY = Symbol('EVENT_WRITE_REPOSITORY')

export interface ICreateEventData {
  userId: string
  title: string
  eventDate: string
  publicToken: string
  displayToken: string
  opensAt?: Date | null
  expiresAt?: Date | null
}

export interface IUpdateEventData {
  title?: string
  eventDate?: string
  status?: EventStatus
  opensAt?: Date | null
  expiresAt?: Date | null
  photosPurgedAt?: Date | null
  displayToken?: string
  albumToken?: string | null
  albumReleasedAt?: Date | null
}

export interface IEventWriteRepository {
  create(data: ICreateEventData): Promise<IEvent>
  update(id: string, data: IUpdateEventData): Promise<IEvent>
  delete(id: string): Promise<void>
}
