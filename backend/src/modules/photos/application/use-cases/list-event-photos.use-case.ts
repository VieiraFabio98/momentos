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
    console.log('eventId', eventId)

    const items = await Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        url: await this.storageProvider.getDownloadUrl(photo.storageKey),
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
