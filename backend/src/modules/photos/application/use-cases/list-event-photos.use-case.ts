import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import {
  IPhotoReadRepository,
  PHOTO_READ_REPOSITORY,
} from '../../domain/repositories/i-photo-read-repository'

export function photoFilename(storageKey: string, index: number): string {
  const extension = storageKey.split('.').pop() ?? 'jpg'
  return `momento-${String(index + 1).padStart(3, '0')}.${extension}`
}

@Injectable()
export class ListEventPhotosUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const photos = await this.photoReadRepository.findAllByEventId(eventId)

    const items = await Promise.all(
      photos.map(async (photo, index) => ({
        id: photo.id,
        url: await this.storageProvider.getDownloadUrl(photo.storageKey),
        downloadUrl: await this.storageProvider.getAttachmentUrl(
          photo.storageKey,
          photoFilename(photo.storageKey, index),
        ),
        guestName: photo.guestName,
        createdAt: photo.createdAt,
      })),
    )

    const participants = new Set(
      photos.map((photo) => photo.guestName).filter((name) => name !== null),
    ).size

    return ok({ total: photos.length, participants, photos: items })
  }
}
