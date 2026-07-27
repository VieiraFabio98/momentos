import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, noContent, notFound } from '../../../../shared/helpers'
import {
  EVENT_READ_REPOSITORY,
  IEventReadRepository,
} from '../../../events/domain/repositories/i-event-read-repository'
import { IStorageProvider, STORAGE_PROVIDER } from '../../domain/providers/i-storage-provider'
import {
  IPhotoReadRepository,
  PHOTO_READ_REPOSITORY,
} from '../../domain/repositories/i-photo-read-repository'
import {
  IPhotoWriteRepository,
  PHOTO_WRITE_REPOSITORY,
} from '../../domain/repositories/i-photo-write-repository'

@Injectable()
export class DeletePhotoUseCase {
  constructor(
    @Inject(EVENT_READ_REPOSITORY)
    private readonly eventReadRepository: IEventReadRepository,
    @Inject(PHOTO_READ_REPOSITORY)
    private readonly photoReadRepository: IPhotoReadRepository,
    @Inject(PHOTO_WRITE_REPOSITORY)
    private readonly photoWriteRepository: IPhotoWriteRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(userId: string, eventId: string, photoId: string): Promise<HttpResponse> {
    const event = await this.eventReadRepository.findById(eventId)
    if (!event || event.userId !== userId) {
      return notFound('Evento não encontrado')
    }

    const photo = await this.photoReadRepository.findById(photoId)
    // a foto tem que ser deste evento: sem esta checagem, o dono de um evento
    // apagaria foto de outro só trocando o id na URL
    if (!photo || photo.eventId !== eventId) {
      return notFound('Foto não encontrada')
    }

    // storage antes da linha: apagar a linha primeiro perderia a storage_key e
    // o objeto ficaria no bucket sem nada apontando para ele
    await this.storageProvider.deleteObjects([photo.storageKey])
    await this.photoWriteRepository.delete(photoId)

    return noContent()
  }
}
