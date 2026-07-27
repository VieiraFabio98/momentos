import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeQrCodeProvider,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { GetDisplayFeedUseCase } from './get-display-feed.use-case'
import { GetDisplayLinkUseCase, RotateDisplayTokenUseCase } from './get-display-link.use-case'

const ONTEM = new Date('2026-07-19T20:00:00.000Z')
const HOJE = new Date('2026-07-20T20:00:00.000Z')

describe('Telão', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository

  beforeEach(() => {
    events = new FakeEventRepository([
      makeEvent({ id: 'event-1', userId: 'user-1', displayToken: 'display-1' }),
      makeEvent({
        id: 'event-2',
        userId: 'user-2',
        publicToken: 'public-2',
        displayToken: 'display-2',
      }),
    ])
    photos = new FakePhotoRepository([
      makePhoto({ id: 'p1', eventId: 'event-1', guestName: 'Marina', createdAt: ONTEM }),
      makePhoto({ id: 'p2', eventId: 'event-1', guestName: null, createdAt: HOJE }),
      makePhoto({ id: 'p3', eventId: 'event-2', guestName: 'Alheia' }),
    ])
  })

  const feed = () =>
    new GetDisplayFeedUseCase(events, photos, new FakeStorageProvider(), new FakeQrCodeProvider())

  describe('GetDisplayFeedUseCase', () => {
    it('devolve as fotos do evento, com QR do link do convidado', async () => {
      const response = await feed().execute('display-1')

      expect(response.statusCode).toBe(200)
      expect(response.data.title).toBe('Ana & João')
      expect(response.data.photos).toHaveLength(2)
      expect(response.data.guestLink).toContain('/e/public-token-1')
      expect(response.data.qrCode).toMatch(/^data:image\/png;base64,/)
    })

    it('não vaza foto de outro evento', async () => {
      const response = await feed().execute('display-1')

      expect(response.data.photos.map((p: { id: string }) => p.id)).toEqual(['p1', 'p2'])
    })

    it('devolve 404 para token de telão inválido', async () => {
      const response = await feed().execute('nao-existe')

      expect(response.statusCode).toBe(404)
    })

    // é o que segura o tráfego durante as horas de festa
    it('com "since", traz só o que chegou depois e omite o QR', async () => {
      const response = await feed().execute('display-1', ONTEM.toISOString())

      expect(response.data.photos.map((p: { id: string }) => p.id)).toEqual(['p2'])
      expect(response.data.qrCode).toBeUndefined()
      expect(response.data.total).toBe(2)
    })

    it('manda os ids vivos no incremental, p/ o telão soltar foto apagada', async () => {
      const response = await feed().execute('display-1', HOJE.toISOString())

      expect(response.data.photos).toHaveLength(0)
      expect(response.data.photoIds).toEqual(['p1', 'p2'])
    })

    it('ignora "since" inválido e devolve a carga completa', async () => {
      const response = await feed().execute('display-1', 'nao-e-data')

      expect(response.data.photos).toHaveLength(2)
      expect(response.data.qrCode).toBeDefined()
    })
  })

  describe('Link do telão', () => {
    it('devolve o link do próprio evento', async () => {
      const response = await new GetDisplayLinkUseCase(events).execute('user-1', 'event-1')

      expect(response.statusCode).toBe(200)
      expect(response.data.displayUrl).toContain('/telao/display-1')
    })

    it('não devolve link de evento alheio', async () => {
      const response = await new GetDisplayLinkUseCase(events).execute('user-1', 'event-2')

      expect(response.statusCode).toBe(404)
    })

    it('trocar o token derruba o link antigo e preserva o QR impresso', async () => {
      const response = await new RotateDisplayTokenUseCase(events).execute('user-1', 'event-1')

      expect(response.data.displayUrl).not.toContain('display-1')
      expect(await events.findByDisplayToken('display-1')).toBeNull()
      expect(events.events[0].publicToken).toBe('public-token-1')
    })

    it('não troca o token de evento alheio', async () => {
      const response = await new RotateDisplayTokenUseCase(events).execute('user-1', 'event-2')

      expect(response.statusCode).toBe(404)
      expect(events.events[1].displayToken).toBe('display-2')
    })
  })
})
