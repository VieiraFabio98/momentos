import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { badRequest, forbidden, HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { EventPlan } from '../../../events/domain/entities/i-event'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import {
  IPhotoReadRepository,
  PHOTO_READ_REPOSITORY,
} from '../../domain/repositories/i-photo-read-repository'
import { RequestPhotoUploadDto } from '../dto/request-photo-upload.dto'

const PLAN_PHOTO_LIMITS: Record<EventPlan, number | null> = {
  degustacao: 30,
  momento: null,
  memoria: null,
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

@Injectable()
export class RequestPhotoUploadUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(publicToken: string, dto: RequestPhotoUploadDto): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findByPublicToken(publicToken)
    if (!event) {
      return notFound('Evento não encontrado')
    }
    if (event.status === 'expired') {
      return forbidden()
    }

    const limit = PLAN_PHOTO_LIMITS[event.plan]
    if (limit !== null) {
      const count = await this.photoReadRepository.countByEventId(event.id)
      if (count >= limit) {
        return badRequest('Limite de fotos do evento atingido')
      }
    }

    const extension = EXTENSION_BY_TYPE[dto.contentType]
    const storageKey = `events/${event.id}/photos/${randomUUID()}.${extension}`
    const uploadUrl = await this.storageProvider.getUploadUrl(storageKey, dto.contentType)

    return ok({ uploadUrl, storageKey })
  }
}
