import { EventPlan, EventStatus, IEvent } from '../entities/i-event'

export const EVENT_WRITE_REPOSITORY = Symbol('EVENT_WRITE_REPOSITORY')

export interface ICreateEventData {
  userId: string
  title: string
  eventDate: string
  publicToken: string
  plan: EventPlan
  opensAt?: Date | null
  expiresAt?: Date | null
}

export interface IUpdateEventData {
  title?: string
  eventDate?: string
  plan?: EventPlan
  status?: EventStatus
  opensAt?: Date | null
  expiresAt?: Date | null
}

export interface IEventWriteRepository {
  create(data: ICreateEventData): Promise<IEvent>
  update(id: string, data: IUpdateEventData): Promise<IEvent>
  delete(id: string): Promise<void>
}
