import { IEvent } from '../entities/i-event'

export const EVENT_READ_REPOSITORY = Symbol('EVENT_READ_REPOSITORY')

export interface IEventReadRepository {
  findAllByUserId(userId: string): Promise<IEvent[]>
  findById(id: string): Promise<IEvent | null>
  findByPublicToken(publicToken: string): Promise<IEvent | null>
}
