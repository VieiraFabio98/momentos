import { Inject, Injectable, Logger } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { badRequest, created, HttpResponse } from '../../../../shared/helpers'
import { IMailProvider, MAIL_PROVIDER } from '../../../mail/domain/i-mail-provider'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../../users/domain/repositories/i-user-read-repository'
import { IEvent } from '../../domain/entities/i-event'
import {
  EVENT_WRITE_REPOSITORY,
  IEventWriteRepository,
} from '../../domain/repositories/i-event-write-repository'
import { deriveEventWindow, opensAtMatchesEventDate } from '../../domain/services/event-window'
import { CreateEventDto } from '../dto/create-event.dto'
import { EventResponseDto } from '../dto/event-response.dto'

@Injectable()
export class CreateEventUseCase {
  private readonly logger = new Logger('CreateEventUseCase')

  constructor(
    @Inject(EVENT_WRITE_REPOSITORY)
    private readonly eventWriteRepository: IEventWriteRepository,
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: IMailProvider,
  ) {}

  async execute(userId: string, dto: CreateEventDto): Promise<HttpResponse> {
    const opensAtInput = dto.opensAt ? new Date(dto.opensAt) : null
    if (opensAtInput && !opensAtMatchesEventDate(opensAtInput, dto.eventDate)) {
      return badRequest('O início dos envios deve ser no dia do evento')
    }

    const { opensAt, expiresAt } = deriveEventWindow(opensAtInput)

    const event = await this.eventWriteRepository.create({
      userId,
      title: dto.title,
      eventDate: dto.eventDate,
      plan: dto.plan,
      publicToken: randomBytes(16).toString('hex'),
      opensAt,
      expiresAt,
    })

    await this.sendCreatedEmail(userId, event)

    return created(EventResponseDto.fromDomain(event))
  }

  private async sendCreatedEmail(userId: string, event: IEvent): Promise<void> {
    try {
      const user = await this.userReadRepository.findById(userId)
      if (!user) return

      const window =
        event.opensAt && event.expiresAt
          ? `<p>Os convidados poderão enviar fotos de
             <strong>${formatDateTime(event.opensAt)}</strong> até
             <strong>${formatDateTime(event.expiresAt)}</strong> (janela de 16 horas).</p>`
          : ''

      await this.mailProvider.send({
        to: user.email,
        subject: `Seu evento "${event.title}" foi criado ✨`,
        html: `
          <p>Olá, ${user.name}!</p>
          <p>O evento <strong>${event.title}</strong> foi criado com sucesso no Momentos.</p>
          ${window}
          <p>Acesse o painel para gerar o QR Code e compartilhar com seus convidados.</p>
          <p>Com carinho,<br />Equipe Momentos</p>
        `,
      })
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail de evento criado (${event.id})`, error as Error)
    }
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}
