import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakePhotoRepository,
  FakeStorageProvider,
} from '../../../../../test/support/fakes'
import { RETENTION_DAYS } from '../../domain/services/retention'
import { PurgeExpiredPhotosUseCase } from './purge-expired-photos.use-case'

const NOW = new Date('2026-07-20T12:00:00.000Z')
const DIA = 24 * 60 * 60 * 1000

function diasAtras(dias: number): Date {
  return new Date(NOW.getTime() - dias * DIA)
}

function makeSut(events: FakeEventRepository, photos: FakePhotoRepository) {
  const storage = new FakeStorageProvider()
  for (const photo of photos.photos) storage.objects.add(photo.storageKey)
  return { sut: new PurgeExpiredPhotosUseCase(events, events, photos, storage), storage }
}

describe('PurgeExpiredPhotosUseCase', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository

  beforeEach(() => {
    events = new FakeEventRepository()
    photos = new FakePhotoRepository()
  })

  it(`apaga fotos e objetos de evento encerrado há mais de ${RETENTION_DAYS} dias`, async () => {
    events.events.push(makeEvent({ id: 'event-1', expiresAt: diasAtras(RETENTION_DAYS + 1) }))
    photos.photos.push(
      makePhoto({ id: 'p1', eventId: 'event-1', storageKey: 'events/event-1/photos/a.jpg' }),
      makePhoto({ id: 'p2', eventId: 'event-1', storageKey: 'events/event-1/photos/b.jpg' }),
    )
    const { sut, storage } = makeSut(events, photos)

    const result = await sut.execute(NOW)

    expect(result).toEqual({ events: 1, photos: 2, objects: 2, failures: 0 })
    expect(photos.photos).toHaveLength(0)
    expect(storage.objects.size).toBe(0)
    expect(events.events[0].photosPurgedAt).toEqual(NOW)
  })

  it('não toca em evento dentro do prazo', async () => {
    events.events.push(makeEvent({ id: 'event-1', expiresAt: diasAtras(RETENTION_DAYS - 1) }))
    photos.photos.push(makePhoto({ eventId: 'event-1' }))
    const { sut, storage } = makeSut(events, photos)

    const result = await sut.execute(NOW)

    expect(result.events).toBe(0)
    expect(photos.photos).toHaveLength(1)
    expect(storage.deleted).toHaveLength(0)
    expect(events.events[0].photosPurgedAt).toBeNull()
  })

  it('não apaga o evento em si — só as fotos', async () => {
    events.events.push(makeEvent({ id: 'event-1', expiresAt: diasAtras(30) }))
    photos.photos.push(makePhoto({ eventId: 'event-1' }))
    const { sut } = makeSut(events, photos)

    await sut.execute(NOW)

    expect(events.events).toHaveLength(1)
    expect(events.events[0].title).toBe('Ana & João')
  })

  // festa sem janela definida nunca ficaria elegível se olhássemos só expiresAt
  it('usa o dia da festa quando o casal nunca definiu janela', async () => {
    events.events.push(
      makeEvent({ id: 'event-1', eventDate: '2026-07-01', opensAt: null, expiresAt: null }),
    )
    photos.photos.push(makePhoto({ eventId: 'event-1', storageKey: 'events/event-1/photos/a.jpg' }))
    const { sut } = makeSut(events, photos)

    const result = await sut.execute(NOW)

    expect(result.events).toBe(1)
    expect(photos.photos).toHaveLength(0)
  })

  it('leva objeto órfão, que subiu ao bucket e nunca foi confirmado', async () => {
    events.events.push(makeEvent({ id: 'event-1', expiresAt: diasAtras(10) }))
    const { sut, storage } = makeSut(events, photos)
    storage.objects.add('events/event-1/photos/orfa.jpg')

    const result = await sut.execute(NOW)

    expect(result.objects).toBe(1)
    expect(storage.objects.size).toBe(0)
  })

  it('não repete o trabalho na rodada seguinte', async () => {
    events.events.push(makeEvent({ id: 'event-1', expiresAt: diasAtras(10) }))
    photos.photos.push(makePhoto({ eventId: 'event-1', storageKey: 'events/event-1/photos/a.jpg' }))
    const { sut, storage } = makeSut(events, photos)

    await sut.execute(NOW)
    const segunda = await sut.execute(new Date(NOW.getTime() + DIA))

    expect(segunda.events).toBe(0)
    expect(storage.deleted).toHaveLength(1)
  })

  it('não marca como apagado quando o storage falha, p/ tentar de novo depois', async () => {
    events.events.push(makeEvent({ id: 'event-1', expiresAt: diasAtras(10) }))
    photos.photos.push(makePhoto({ eventId: 'event-1' }))
    const { sut, storage } = makeSut(events, photos)
    vi.spyOn(storage, 'deleteByPrefix').mockRejectedValue(new Error('S3 fora do ar'))

    const result = await sut.execute(NOW)

    expect(result).toMatchObject({ events: 0, failures: 1 })
    expect(events.events[0].photosPurgedAt).toBeNull()
    expect(photos.photos).toHaveLength(1)
  })

  it('um evento com falha não impede a limpeza dos outros', async () => {
    events.events.push(
      makeEvent({ id: 'event-1', eventDate: '2026-06-01', expiresAt: diasAtras(20) }),
      makeEvent({ id: 'event-2', eventDate: '2026-06-02', expiresAt: diasAtras(19) }),
    )
    photos.photos.push(
      makePhoto({ id: 'p1', eventId: 'event-1', storageKey: 'events/event-1/photos/a.jpg' }),
      makePhoto({ id: 'p2', eventId: 'event-2', storageKey: 'events/event-2/photos/b.jpg' }),
    )
    const { sut, storage } = makeSut(events, photos)
    vi.spyOn(storage, 'deleteByPrefix').mockImplementation(async (prefix: string) => {
      if (prefix.includes('event-1')) throw new Error('S3 fora do ar')
      const matching = [...storage.objects].filter((key) => key.startsWith(prefix))
      for (const key of matching) storage.objects.delete(key)
      return matching.length
    })

    const result = await sut.execute(NOW)

    expect(result).toMatchObject({ events: 1, photos: 1, failures: 1 })
    expect(photos.photos.map((p) => p.id)).toEqual(['p1'])
    expect(events.events[1].photosPurgedAt).toEqual(NOW)
  })
})
