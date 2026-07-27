import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import {
  EVENT_WRITE_REPOSITORY,
  IEventWriteRepository,
} from '../../../events/domain/repositories/i-event-write-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import {
  IPhotoWriteRepository,
  PHOTO_WRITE_REPOSITORY,
} from '../../domain/repositories/i-photo-write-repository'
import { eventStoragePrefix, retentionCutoff } from '../../domain/services/retention'

// teto por rodada: o job roda de novo em seguida e o que sobrou entra na
// próxima, então uma festa gigante nunca segura a varredura inteira
export const PURGE_BATCH_SIZE = 50

export interface IPurgeResult {
  events: number
  photos: number
  objects: number
  failures: number
}

@Injectable()
export class PurgeExpiredPhotosUseCase {
  private readonly logger = new Logger('PurgeExpiredPhotos')

  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(EVENT_WRITE_REPOSITORY)
    private readonly eventWriteRepository: IEventWriteRepository,
    @Inject(PHOTO_WRITE_REPOSITORY)
    private readonly photoWriteRepository: IPhotoWriteRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(now: Date = new Date()): Promise<IPurgeResult> {
    const events = await this.eventReadRepository.findPendingPhotoPurge(
      retentionCutoff(now),
      PURGE_BATCH_SIZE,
    )

    const result: IPurgeResult = { events: 0, photos: 0, objects: 0, failures: 0 }

    for (const event of events) {
      try {
        // storage primeiro: se falhar no meio, o evento continua sem marca e a
        // próxima rodada tenta de novo. Apagar as linhas antes deixaria os
        // objetos órfãos no bucket, sem nada apontando para eles.
        const objects = await this.storageProvider.deleteByPrefix(eventStoragePrefix(event.id))
        const photos = await this.photoWriteRepository.deleteByEventId(event.id)
        await this.eventWriteRepository.update(event.id, { photosPurgedAt: now })

        result.events += 1
        result.photos += photos
        result.objects += objects
      } catch (error) {
        // um evento problemático não pode abortar a varredura dos outros
        result.failures += 1
        this.logger.error(
          `Falha ao apagar as fotos do evento ${event.id}: ${(error as Error).message}`,
        )
      }
    }

    if (result.events > 0 || result.failures > 0) {
      this.logger.log(
        `Retenção: ${result.events} evento(s), ${result.photos} foto(s), ` +
          `${result.objects} objeto(s) no storage, ${result.failures} falha(s)`,
      )
    }

    return result
  }
}
