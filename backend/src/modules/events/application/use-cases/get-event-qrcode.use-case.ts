import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { IQrCodeProvider, QRCODE_PROVIDER } from '../../domain/providers/i-qrcode-provider'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../domain/repositories/i-event-read-repository'

@Injectable()
export class GetEventQrCodeUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(QRCODE_PROVIDER)
    private readonly qrCodeProvider: IQrCodeProvider,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const guestLink = `${frontendUrl}/e/${event.publicToken}`
    const qrCode = await this.qrCodeProvider.toDataUrl(guestLink)

    return ok({ guestLink, qrCode })
  }
}
