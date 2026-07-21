import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeQrCodeProvider,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { DeleteEventUseCase } from './delete-event.use-case'
import { GetEventQrCodeUseCase } from './get-event-qrcode.use-case'
import { GetEventUseCase } from './get-event.use-case'
import { ListMyEventsUseCase } from './list-my-events.use-case'
import { UpdateEventUseCase } from './update-event.use-case'

// evento do casal 1 e evento de outro casal, p/ provar o isolamento entre contas
const OWN_EVENT = makeEvent({ id: 'event-1', userId: 'user-1' })
const OTHER_EVENT = makeEvent({
  id: 'event-2',
  userId: 'user-2',
  publicToken: 'public-token-2',
})

describe('Eventos — ownership do casal', () => {
  let events: FakeEventRepository

  beforeEach(() => {
    events = new FakeEventRepository([{ ...OWN_EVENT }, { ...OTHER_EVENT }])
  })

  describe('GetEventUseCase', () => {
    it('devolve o evento do próprio casal', async () => {
      const response = await new GetEventUseCase(events).execute('user-1', 'event-1')

      expect(response.statusCode).toBe(200)
      expect(response.data.id).toBe('event-1')
    })

    it('devolve 404 (não 403) para evento de outro casal, sem vazar existência', async () => {
      const response = await new GetEventUseCase(events).execute('user-1', 'event-2')

      expect(response.statusCode).toBe(404)
    })
  })

  describe('ListMyEventsUseCase', () => {
    it('lista apenas os eventos do usuário autenticado', async () => {
      const response = await new ListMyEventsUseCase(events).execute('user-1')

      expect(response.data).toHaveLength(1)
      expect(response.data[0].id).toBe('event-1')
    })
  })

  describe('UpdateEventUseCase', () => {
    it('atualiza título e recalcula a janela ao mudar opensAt', async () => {
      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        title: 'Novo título',
        opensAt: '2026-06-20T18:00:00.000Z',
      })

      expect(response.statusCode).toBe(200)
      expect(response.data.title).toBe('Novo título')
      expect(response.data.expiresAt?.toISOString()).toBe('2026-06-21T10:00:00.000Z')
    })

    it('recusa início de envios fora do dia da festa', async () => {
      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        opensAt: '2026-06-25T18:00:00.000Z',
      })

      expect(response.statusCode).toBe(400)
      expect(events.events[0].opensAt).toBeNull()
    })

    it('leva a janela junto ao remarcar a festa, preservando o horário', async () => {
      // festa em 20/06 com envios abrindo às 18h de Brasília
      events.events[0].opensAt = new Date('2026-06-20T21:00:00.000Z')
      events.events[0].expiresAt = new Date('2026-06-21T13:00:00.000Z')

      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        eventDate: '2026-07-04',
      })

      expect(response.data.opensAt?.toISOString()).toBe('2026-07-04T21:00:00.000Z')
      expect(response.data.expiresAt?.toISOString()).toBe('2026-07-05T13:00:00.000Z')
    })

    it('não inventa janela ao remarcar evento que não tinha uma', async () => {
      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        eventDate: '2026-07-04',
      })

      expect(response.data.opensAt).toBeNull()
      expect(response.data.expiresAt).toBeNull()
    })

    it('mantém a janela ao editar só o título', async () => {
      events.events[0].opensAt = new Date('2026-06-20T21:00:00.000Z')

      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        title: 'Outro título',
      })

      expect(response.data.opensAt?.toISOString()).toBe('2026-06-20T21:00:00.000Z')
    })

    it('valida contra a nova data quando o evento é remarcado no mesmo pedido', async () => {
      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        eventDate: '2026-07-04',
        opensAt: '2026-07-04T21:00:00.000Z',
      })

      expect(response.statusCode).toBe(200)
      expect(response.data.eventDate).toBe('2026-07-04')
    })

    it('preserva a janela quando opensAt não vem no payload', async () => {
      events.events[0].opensAt = new Date('2026-06-20T18:00:00.000Z')
      events.events[0].expiresAt = new Date('2026-06-21T10:00:00.000Z')

      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        title: 'Só o título',
      })

      expect(response.data.opensAt?.toISOString()).toBe('2026-06-20T18:00:00.000Z')
    })

    it('limpa a janela quando opensAt vem nulo', async () => {
      events.events[0].opensAt = new Date('2026-06-20T18:00:00.000Z')

      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-1', {
        opensAt: null,
      })

      expect(response.data.opensAt).toBeNull()
      expect(response.data.expiresAt).toBeNull()
    })

    it('não atualiza evento de outro casal', async () => {
      const response = await new UpdateEventUseCase(events).execute('user-1', 'event-2', {
        title: 'Invadido',
      })

      expect(response.statusCode).toBe(404)
      expect(events.events[1].title).toBe(OTHER_EVENT.title)
    })
  })

  describe('DeleteEventUseCase', () => {
    it('apaga o evento do próprio casal', async () => {
      const photos = new FakePhotoRepository()
      const storage = new FakeStorageProvider()

      const response = await new DeleteEventUseCase(events, photos, storage).execute(
        'user-1',
        'event-1',
      )

      expect(response.statusCode).toBe(204)
      expect(events.events.map((event) => event.id)).toEqual(['event-2'])
    })

    it('remove as fotos do storage quando o plano é degustação', async () => {
      events.events[0].plan = 'degustacao'
      const photos = new FakePhotoRepository([
        makePhoto({ id: 'photo-1', storageKey: 'events/event-1/photos/a.jpg' }),
        makePhoto({ id: 'photo-2', storageKey: 'events/event-1/photos/b.jpg' }),
      ])
      const storage = new FakeStorageProvider()

      await new DeleteEventUseCase(events, photos, storage).execute('user-1', 'event-1')

      expect(storage.deleted).toEqual([
        'events/event-1/photos/a.jpg',
        'events/event-1/photos/b.jpg',
      ])
    })

    it('mantém as fotos no storage nos planos pagos', async () => {
      const photos = new FakePhotoRepository([makePhoto()])
      const storage = new FakeStorageProvider()

      await new DeleteEventUseCase(events, photos, storage).execute('user-1', 'event-1')

      expect(storage.deleted).toHaveLength(0)
    })

    it('não apaga evento de outro casal', async () => {
      const storage = new FakeStorageProvider()

      const response = await new DeleteEventUseCase(
        events,
        new FakePhotoRepository(),
        storage,
      ).execute('user-1', 'event-2')

      expect(response.statusCode).toBe(404)
      expect(events.events).toHaveLength(2)
    })
  })

  describe('GetEventQrCodeUseCase', () => {
    it('gera o link do convidado com o token público do evento', async () => {
      const response = await new GetEventQrCodeUseCase(events, new FakeQrCodeProvider()).execute(
        'user-1',
        'event-1',
      )

      expect(response.statusCode).toBe(200)
      expect(response.data.guestLink).toContain('/e/public-token-1')
      expect(response.data.qrCode).toMatch(/^data:image\/png;base64,/)
    })

    it('não gera QR Code de evento de outro casal', async () => {
      const response = await new GetEventQrCodeUseCase(events, new FakeQrCodeProvider()).execute(
        'user-1',
        'event-2',
      )

      expect(response.statusCode).toBe(404)
    })
  })
})
