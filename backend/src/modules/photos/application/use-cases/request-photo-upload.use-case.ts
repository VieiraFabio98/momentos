import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { forbidden, HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { getEventWindowState } from '../../../events/domain/services/event-window'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import { photoStorageKey } from '../../domain/services/retention'
import { RequestPhotoUploadDto } from '../dto/request-photo-upload.dto'

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
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(publicToken: string, dto: RequestPhotoUploadDto): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findByPublicToken(publicToken)
    if (!event) {
      return notFound('Evento não encontrado')
    }
    if (getEventWindowState(event) !== 'open') {
      return forbidden()
    }

    const extension = EXTENSION_BY_TYPE[dto.contentType]
    const storageKey = photoStorageKey(event.id, randomUUID(), extension)
    const uploadUrl = await this.storageProvider.getUploadUrl(
      storageKey,
      dto.contentType,
      dto.size,
    )

    return ok({ uploadUrl, storageKey })
  }
}
