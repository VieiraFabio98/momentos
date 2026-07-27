import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '../../../photos/domain/providers/i-storage-provider'
import {
  IPhotoReadRepository,
  PHOTO_READ_REPOSITORY,
} from '../../../photos/domain/repositories/i-photo-read-repository'
import { IQrCodeProvider, QRCODE_PROVIDER } from '../../domain/providers/i-qrcode-provider'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../domain/repositories/i-event-read-repository'

@Injectable()
export class GetDisplayFeedUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    @Inject(QRCODE_PROVIDER)
    private readonly qrCodeProvider: IQrCodeProvider,
  ) {}

  /**
   * Feed do telão, sem autenticação — quem tem o link secreto projeta.
   *
   * `since` existe por causa da festa inteira: o telão fica horas de pé e
   * perguntando por fotos novas. Sem ele, cada consulta devolveria as URLs
   * assinadas do álbum inteiro, o que na wi-fi do salão vira tráfego à toa.
   * Com ele, a consulta rotineira traz só o que chegou depois.
   */
  async execute(displayToken: string, since?: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findByDisplayToken(displayToken)
    if (!event) {
      return notFound('Telão não encontrado')
    }

    const all = await this.photoReadRepository.findAllByEventId(event.id)

    const sinceDate = since ? new Date(since) : null
    const isIncremental = sinceDate !== null && !Number.isNaN(sinceDate.getTime())
    const selected = isIncremental
      ? all.filter((photo) => photo.createdAt > sinceDate!)
      : all

    const photos = await Promise.all(
      selected.map(async (photo) => ({
        id: photo.id,
        url: await this.storageProvider.getDownloadUrl(photo.storageKey),
        guestName: photo.guestName,
        createdAt: photo.createdAt,
      })),
    )

    // o QR só vai na carga completa: reenviá-lo a cada consulta seria repetir
    // uns 2 KB de base64 para sempre, e ele não muda
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const guestLink = `${frontendUrl}/e/${event.publicToken}`

    return ok({
      title: event.title,
      total: all.length,
      // ids vivos, p/ o telão largar a foto que o casal apagou pela lixeira
      photoIds: isIncremental ? all.map((photo) => photo.id) : undefined,
      guestLink: isIncremental ? undefined : guestLink,
      qrCode: isIncremental ? undefined : await this.qrCodeProvider.toDataUrl(guestLink),
      photos,
    })
  }
}
