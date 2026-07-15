import { IEventReadRepository } from './i-event-read-repository'
import { IEventWriteRepository } from './i-event-write-repository'

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY')

export interface IEventRepository extends IEventReadRepository, IEventWriteRepository {}
