import { IPhoto } from '../entities/i-photo'

export const PHOTO_READ_REPOSITORY = Symbol('PHOTO_READ_REPOSITORY')

export interface IPhotoReadRepository {
  findById(id: string): Promise<IPhoto | null>
  findAllByEventId(eventId: string): Promise<IPhoto[]>
  countByEventId(eventId: string): Promise<number>
}
