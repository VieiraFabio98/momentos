import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { IEvent } from '../../../events/domain/entities/i-event'
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

// só um evento com álbum efetivamente liberado responde; token válido mas
// não liberado (ou já revogado) some para o casal.
export function isAlbumReleased(event: IEvent | null): event is IEvent {
  return event !== null && event.albumReleasedAt !== null
}

@Injectable()
export class GetPublicAlbumUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  // álbum curado, read-only, sem login: quem tem o link (o casal) vê o resultado
  // final. Sem `since`/QR do telão — aqui é o álbum fechado, não o feed ao vivo.
  async execute(albumToken: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findByAlbumToken(albumToken)
    if (!isAlbumReleased(event)) {
      return notFound('Álbum não encontrado')
    }

    const photos = await this.photoReadRepository.findAllByEventId(event.id)

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

    return ok({
      title: event.title,
      eventDate: event.eventDate,
      releasedAt: event.albumReleasedAt,
      total: photos.length,
      participants,
      photos: items,
    })
  }
}
