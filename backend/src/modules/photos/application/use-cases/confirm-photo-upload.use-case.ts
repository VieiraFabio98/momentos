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
import {
  ALLOWED_CONTENT_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MIN_PHOTO_SIZE_BYTES,
} from '../dto/request-photo-upload.dto'

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

    const metadata = await this.storageProvider.getObjectMetadata(dto.storageKey)
    if (!metadata) {
      return badRequest('Arquivo não encontrado no storage')
    }

    // o objeto já está no bucket: se não bater com as regras, remove antes de recusar
    const typeAllowed = (ALLOWED_CONTENT_TYPES as readonly string[]).includes(metadata.contentType)
    const sizeAllowed =
      metadata.size >= MIN_PHOTO_SIZE_BYTES && metadata.size <= MAX_PHOTO_SIZE_BYTES

    if (!typeAllowed || !sizeAllowed) {
      await this.storageProvider.deleteObjects([dto.storageKey])
      return badRequest(
        typeAllowed ? 'Arquivo fora do tamanho permitido' : 'Tipo de arquivo não permitido',
      )
    }

    const photo = await this.photoWriteRepository.create({
      eventId: event.id,
      storageKey: dto.storageKey,
      guestName: dto.guestName?.trim() || null,
      consentVersion: dto.consentVersion,
      consentedAt: new Date(),
    })

    return created({ id: photo.id, createdAt: photo.createdAt })
  }
}
