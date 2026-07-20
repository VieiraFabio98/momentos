import { IPhoto } from '../entities/i-photo'

export const PHOTO_WRITE_REPOSITORY = Symbol('PHOTO_WRITE_REPOSITORY')

export interface ICreatePhotoData {
  eventId: string
  storageKey: string
  guestName: string | null
  consentVersion: string
  consentedAt: Date
}

export interface IPhotoWriteRepository {
  create(data: ICreatePhotoData): Promise<IPhoto>
  delete(id: string): Promise<void>
}
