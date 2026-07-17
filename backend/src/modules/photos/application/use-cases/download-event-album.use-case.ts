import { Inject, Injectable } from '@nestjs/common'
import archiver = require('archiver')
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import {
  IPhotoReadRepository,
  PHOTO_READ_REPOSITORY,
} from '../../domain/repositories/i-photo-read-repository'
import { photoFilename } from './list-event-photos.use-case'

export interface IAlbumArchive {
  filename: string
  archive: archiver.Archiver
}

export type DownloadAlbumError = 'not_found' | 'empty'

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'album'
  )
}

@Injectable()
export class DownloadEventAlbumUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(userId: string, eventId: string): Promise<IAlbumArchive | DownloadAlbumError> {
    const event = await this.eventReadRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return 'not_found'
    }

    const photos = await this.photoReadRepository.findAllByEventId(eventId)
    if (photos.length === 0) {
      return 'empty'
    }

    const archive = archiver('zip', { zlib: { level: 0 } })
    for (const [index, photo] of photos.entries()) {
      const stream = await this.storageProvider.getObjectStream(photo.storageKey)
      archive.append(stream, { name: photoFilename(photo.storageKey, index) })
    }
    void archive.finalize()

    return { filename: `momentos-${slugify(event.title)}.zip`, archive }
  }
}
