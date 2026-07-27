import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, noContent, notFound } from '../../../../shared/helpers'
import { STORAGE_PROVIDER, IStorageProvider } from '../../../photos/domain/providers/i-storage-provider'
import { eventStoragePrefix } from '../../../photos/domain/services/retention'
import { EVENT_REPOSITORY, IEventRepository } from '../../domain/repositories/i-event-repository'

@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(userId: string, eventId: string): Promise<HttpResponse> {
    const event = await this.eventRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    // Storage antes do banco, e em qualquer plano: apagar a linha primeiro
    // levaria junto as chaves das fotos, e nada mais no sistema saberia dizer
    // onde aqueles objetos estão. Por prefixo, não por chave, para levar também
    // o que subiu ao bucket sem confirmação.
    await this.storageProvider.deleteByPrefix(eventStoragePrefix(eventId))
    await this.eventRepository.delete(eventId)
    return noContent()
  }
}
