import { Inject, Injectable } from '@nestjs/common'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import { eventStoragePrefix } from '../../domain/services/retention'

/**
 * Apaga do storage as fotos de todos os eventos de um usuário.
 *
 * Mora aqui, e não no módulo de usuários, por dois motivos: as dependências
 * (repositório de eventos e storage) já estão neste módulo, e assim o
 * DeleteUserUseCase não precisa conhecer S3 nem o formato das chaves.
 */
@Injectable()
export class PurgeUserPhotosUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(userId: string): Promise<number> {
    const events = await this.eventReadRepository.findAllByUserId(userId)

    let deleted = 0
    for (const event of events) {
      deleted += await this.storageProvider.deleteByPrefix(eventStoragePrefix(event.id))
    }
    return deleted
  }
}
