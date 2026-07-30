import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { GetPublicAlbumUseCase } from './get-public-album.use-case'

describe('GetPublicAlbumUseCase', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository
  let useCase: GetPublicAlbumUseCase

  beforeEach(() => {
    events = new FakeEventRepository([
      makeEvent({
        id: 'event-1',
        albumToken: 'album-1',
        albumReleasedAt: new Date('2026-06-21T00:00:00.000Z'),
      }),
      // token válido mas ainda não liberado
      makeEvent({ id: 'event-2', albumToken: 'album-2', albumReleasedAt: null }),
    ])
    photos = new FakePhotoRepository([
      makePhoto({ id: 'p1', eventId: 'event-1', guestName: 'Marina' }),
      makePhoto({ id: 'p2', eventId: 'event-1', guestName: null }),
      makePhoto({ id: 'p3', eventId: 'event-2', guestName: 'Alheia' }),
    ])
    useCase = new GetPublicAlbumUseCase(events, photos, new FakeStorageProvider())
  })

  it('devolve o álbum liberado com fotos e contadores', async () => {
    const response = await useCase.execute('album-1')

    expect(response.statusCode).toBe(200)
    expect(response.data.title).toBe('Ana & João')
    expect(response.data.total).toBe(2)
    expect(response.data.participants).toBe(1)
    expect(response.data.photos.map((p: { id: string }) => p.id)).toEqual(['p1', 'p2'])
  })

  it('cada foto traz url de exibição e url de download', async () => {
    const response = await useCase.execute('album-1')

    expect(response.data.photos[0].url).toBeTruthy()
    expect(response.data.photos[0].downloadUrl).toBeTruthy()
  })

  it('404 para álbum com token válido mas não liberado', async () => {
    const response = await useCase.execute('album-2')

    expect(response.statusCode).toBe(404)
  })

  it('404 para token inexistente', async () => {
    const response = await useCase.execute('nao-existe')

    expect(response.statusCode).toBe(404)
  })
})
