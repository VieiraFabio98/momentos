import { Inject, Injectable } from '@nestjs/common'
import { badRequest, created, HttpResponse, notFound } from '../../../../shared/helpers'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import {
  IPhotoWriteRepository,
  PHOTO_WRITE_REPOSITORY,
} from '../../domain/repositories/i-photo-write-repository'
import { ConfirmPhotoUploadDto } from '../dto/confirm-photo-upload.dto'

@Injectable()
export class ConfirmPhotoUploadUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_WRITE_REPOSITORY)
    private readonly photoWriteRepository: IPhotoWriteRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(publicToken: string, dto: ConfirmPhotoUploadDto): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findByPublicToken(publicToken)
    if (!event) {
      return notFound('Evento não encontrado')
    }

    const expectedPrefix = `events/${event.id}/photos/`
    if (!dto.storageKey.startsWith(expectedPrefix)) {
      return badRequest('storageKey não pertence a este evento')
    }

    const uploaded = await this.storageProvider.exists(dto.storageKey)
    if (!uploaded) {
      return badRequest('Arquivo não encontrado no storage')
    }

    const photo = await this.photoWriteRepository.create({
      eventId: event.id,
      storageKey: dto.storageKey,
      guestName: dto.guestName?.trim() || null,
    })

    return created({ id: photo.id, createdAt: photo.createdAt })
  }
}
