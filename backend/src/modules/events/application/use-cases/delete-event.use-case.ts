import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, noContent, notFound } from '../../../../shared/helpers'
import { STORAGE_PROVIDER, IStorageProvider } from '../../../photos/domain/providers/i-storage-provider'
import {
  PHOTO_READ_REPOSITORY,
  IPhotoReadRepository,
} from '../../../photos/domain/repositories/i-photo-read-repository'
import { EVENT_REPOSITORY, IEventRepository } from '../../domain/repositories/i-event-repository'

@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }
    if (event.plan === 'degustacao') {
      const photos = await this.photoReadRepository.findAllByEventId(eventId)
      if (photos.length > 0) {
        await this.storageProvider.deleteObjects(photos.map((photo) => photo.storageKey))
      }
    }
    await this.eventRepository.delete(eventId)
    return noContent()
  }
}
