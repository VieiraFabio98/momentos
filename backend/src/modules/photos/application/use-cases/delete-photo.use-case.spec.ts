import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { DeletePhotoUseCase } from './delete-photo.use-case'

describe('DeletePhotoUseCase', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository
  let storage: FakeStorageProvider
  let sut: DeletePhotoUseCase

  beforeEach(() => {
    events = new FakeEventRepository([
      makeEvent({ id: 'event-1', userId: 'user-1' }),
      makeEvent({ id: 'event-2', userId: 'user-2', publicToken: 'token-2' }),
    ])
    photos = new FakePhotoRepository([
      makePhoto({ id: 'photo-1', eventId: 'event-1', storageKey: 'events/event-1/photos/a.jpg' }),
      makePhoto({ id: 'photo-2', eventId: 'event-2', storageKey: 'events/event-2/photos/b.jpg' }),
    ])
    storage = new FakeStorageProvider()
    sut = new DeletePhotoUseCase(events, photos, photos, storage)
  })

  it('apaga a foto do próprio álbum, no banco e no storage', async () => {
    const response = await sut.execute('user-1', 'event-1', 'photo-1')

    expect(response.statusCode).toBe(204)
    expect(photos.photos.map((photo) => photo.id)).toEqual(['photo-2'])
    expect(storage.deleted).toEqual(['events/event-1/photos/a.jpg'])
  })

  it('não apaga foto de álbum de outro casal', async () => {
    const response = await sut.execute('user-1', 'event-2', 'photo-2')

    expect(response.statusCode).toBe(404)
    expect(photos.photos).toHaveLength(2)
    expect(storage.deleted).toHaveLength(0)
  })

  // sem a checagem de vínculo, o dono do event-1 apagaria a foto do event-2
  // apenas trocando o id na URL
  it('recusa foto que não pertence ao evento informado', async () => {
    const response = await sut.execute('user-1', 'event-1', 'photo-2')

    expect(response.statusCode).toBe(404)
    expect(photos.photos).toHaveLength(2)
    expect(storage.deleted).toHaveLength(0)
  })

  it('devolve 404 para foto inexistente', async () => {
    const response = await sut.execute('user-1', 'event-1', 'photo-999')

    expect(response.statusCode).toBe(404)
    expect(storage.deleted).toHaveLength(0)
  })

  it('mantém a linha quando o storage falha, p/ não deixar objeto órfão', async () => {
    storage.deleteObjects = async () => {
      throw new Error('S3 fora do ar')
    }

    await expect(sut.execute('user-1', 'event-1', 'photo-1')).rejects.toThrow('S3 fora do ar')
    expect(photos.photos).toHaveLength(2)
  })
})
