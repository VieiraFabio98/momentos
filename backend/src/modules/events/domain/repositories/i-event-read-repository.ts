import { IEvent } from '../entities/i-event'

export const EVENT_READ_REPOSITORY = Symbol('EVENT_READ_REPOSITORY')

export interface IEventReadRepository {
  findAllByUserId(userId: string): Promise<IEvent[]>
  findById(id: string): Promise<IEvent | null>
  findByPublicToken(publicToken: string): Promise<IEvent | null>
  findByDisplayToken(displayToken: string): Promise<IEvent | null>
  // eventos encerrados antes de `endedBefore` cujas fotos ainda não foram
  // apagadas pela retenção; ordem estável para o job varrer o mais antigo antes
  findPendingPhotoPurge(endedBefore: Date, limit: number): Promise<IEvent[]>
}
