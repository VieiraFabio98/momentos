import { IPhotoReadRepository } from './i-photo-read-repository'
import { IPhotoWriteRepository } from './i-photo-write-repository'

export const PHOTO_REPOSITORY = Symbol('PHOTO_REPOSITORY')

export interface IPhotoRepository extends IPhotoReadRepository, IPhotoWriteRepository {}
