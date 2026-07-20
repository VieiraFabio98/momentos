import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { ListEventPhotosUseCase, photoFilename } from './list-event-photos.use-case'

describe('photoFilename', () => {
  it('numera a partir de 1 com 3 dígitos e preserva a extensão', () => {
    expect(photoFilename('events/e/photos/abc.webp', 0)).toBe('momento-001.webp')
    expect(photoFilename('events/e/photos/abc.jpg', 41)).toBe('momento-042.jpg')
  })

  it('cai em jpg quando a chave não tem extensão', () => {
    expect(photoFilename('events/e/photos/semextensao', 0)).toBe('momento-001.jpg')
  })
})

describe('ListEventPhotosUseCase', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository
  let storage: FakeStorageProvider
  let useCase: ListEventPhotosUseCase

  beforeEach(() => {
    events = new FakeEventRepository([makeEvent(), makeEvent({ id: 'event-2', userId: 'user-2' })])
    photos = new FakePhotoRepository()
    storage = new FakeStorageProvider()
    useCase = new ListEventPhotosUseCase(events, photos, storage)
  })

  it('devolve as fotos com url de visualização e de download', async () => {
    photos.photos = [makePhoto({ storageKey: 'events/event-1/photos/a.jpg' })]

    const response = await useCase.execute('user-1', 'event-1')

    expect(response.statusCode).toBe(200)
    expect(response.data.total).toBe(1)
    expect(response.data.photos[0].url).toBe('https://storage.test/events/event-1/photos/a.jpg')
    expect(response.data.photos[0].downloadUrl).toContain('filename=momento-001.jpg')
  })

  it('conta participantes distintos ignorando envios anônimos', async () => {
    photos.photos = [
      makePhoto({ id: 'p1', guestName: 'Ana' }),
      makePhoto({ id: 'p2', guestName: 'Ana' }),
      makePhoto({ id: 'p3', guestName: 'João' }),
      makePhoto({ id: 'p4', guestName: null }),
    ]

    const response = await useCase.execute('user-1', 'event-1')

    expect(response.data.total).toBe(4)
    expect(response.data.participants).toBe(2)
  })

  it('devolve álbum vazio sem erro', async () => {
    const response = await useCase.execute('user-1', 'event-1')

    expect(response.statusCode).toBe(200)
    expect(response.data).toMatchObject({ total: 0, participants: 0, photos: [] })
  })

  it('não lista fotos de evento de outro casal', async () => {
    const response = await useCase.execute('user-1', 'event-2')

    expect(response.statusCode).toBe(404)
  })
})
