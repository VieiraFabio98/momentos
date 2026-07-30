import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { DownloadEventAlbumUseCase, IAlbumArchive } from './download-event-album.use-case'

describe('DownloadEventAlbumUseCase', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository
  let storage: FakeStorageProvider
  let useCase: DownloadEventAlbumUseCase

  beforeEach(() => {
    events = new FakeEventRepository([
      makeEvent({
        title: 'Ana & João — Casamento',
        albumToken: 'album-1',
        albumReleasedAt: new Date('2026-06-21T00:00:00.000Z'),
      }),
      makeEvent({ id: 'event-2', userId: 'user-2', albumToken: 'album-2', albumReleasedAt: null }),
    ])
    photos = new FakePhotoRepository([
      makePhoto({ id: 'p1', storageKey: 'events/event-1/photos/a.jpg' }),
      makePhoto({ id: 'p2', storageKey: 'events/event-1/photos/b.webp' }),
    ])
    storage = new FakeStorageProvider()
    useCase = new DownloadEventAlbumUseCase(events, photos, storage)
  })

  it('gera o zip com nome derivado do título, sem acentos', async () => {
    const result = (await useCase.execute('user-1', 'event-1')) as IAlbumArchive

    expect(result.filename).toBe('momentos-ana-joao-casamento.zip')
  })

  it('produz um zip com uma entrada por foto', async () => {
    const result = (await useCase.execute('user-1', 'event-1')) as IAlbumArchive
    const chunks: Buffer[] = []
    for await (const chunk of result.archive) {
      chunks.push(chunk as Buffer)
    }
    const zip = Buffer.concat(chunks).toString('binary')

    expect(zip).toContain('momento-001.jpg')
    expect(zip).toContain('momento-002.webp')
  })

  it('retorna "empty" quando o evento não tem fotos', async () => {
    photos.photos = []

    expect(await useCase.execute('user-1', 'event-1')).toBe('empty')
  })

  it('retorna "not_found" para evento de outro casal', async () => {
    expect(await useCase.execute('user-1', 'event-2')).toBe('not_found')
  })

  it('retorna "not_found" para evento inexistente', async () => {
    expect(await useCase.execute('user-1', 'event-999')).toBe('not_found')
  })

  it('baixa o álbum público por albumToken liberado', async () => {
    const result = (await useCase.executeByAlbumToken('album-1')) as IAlbumArchive

    expect(result.filename).toBe('momentos-ana-joao-casamento.zip')
  })

  it('não baixa por albumToken de álbum não liberado', async () => {
    expect(await useCase.executeByAlbumToken('album-2')).toBe('not_found')
  })

  it('não baixa por albumToken inexistente', async () => {
    expect(await useCase.executeByAlbumToken('nao-existe')).toBe('not_found')
  })
})
