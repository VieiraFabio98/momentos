import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent } from '../../../../../test/support/builders'
import { FakeEventRepository, FakePhotoRepository, FakeStorageProvider } from '../../../../../test/support/fakes'
import { MAX_PHOTO_SIZE_BYTES } from '../dto/request-photo-upload.dto'
import { ConfirmPhotoUploadUseCase } from './confirm-photo-upload.use-case'

describe('ConfirmPhotoUploadUseCase', () => {
  const storageKey = 'events/event-1/photos/abc.jpg'

  let events: FakeEventRepository
  let photos: FakePhotoRepository
  let storage: FakeStorageProvider
  let useCase: ConfirmPhotoUploadUseCase

  beforeEach(() => {
    events = new FakeEventRepository([makeEvent()])
    photos = new FakePhotoRepository()
    storage = new FakeStorageProvider()
    storage.metadata.set(storageKey, { size: 300_000, contentType: 'image/jpeg' })
    useCase = new ConfirmPhotoUploadUseCase(events, photos, storage)
  })

  it('registra a foto quando o objeto no storage é válido', async () => {
    const response = await useCase.execute('public-token-1', { storageKey, guestName: ' Ana ', consentVersion: '1' })

    expect(response.statusCode).toBe(201)
    expect(photos.photos).toHaveLength(1)
    expect(photos.photos[0].guestName).toBe('Ana')
  })

  it('grava a versão do termo aceita e o instante do aceite', async () => {
    await useCase.execute('public-token-1', { storageKey, consentVersion: '1' })

    expect(photos.photos[0].consentVersion).toBe('1')
    expect(photos.photos[0].consentedAt).toBeInstanceOf(Date)
  })

  it('grava guestName nulo quando o convidado não se identifica', async () => {
    await useCase.execute('public-token-1', { storageKey, guestName: '   ', consentVersion: '1' })

    expect(photos.photos[0].guestName).toBeNull()
  })

  it('retorna 404 quando o token público não existe', async () => {
    const response = await useCase.execute('token-inexistente', { storageKey, consentVersion: '1' })

    expect(response.statusCode).toBe(404)
  })

  it('recusa storageKey de outro evento', async () => {
    const response = await useCase.execute('public-token-1', {
      storageKey: 'events/event-999/photos/abc.jpg',
      consentVersion: '1',
    })

    expect(response.statusCode).toBe(400)
    expect(photos.photos).toHaveLength(0)
  })

  it('recusa quando o arquivo não chegou ao storage', async () => {
    const response = await useCase.execute('public-token-1', {
      storageKey: 'events/event-1/photos/nao-enviada.jpg',
      consentVersion: '1',
    })

    expect(response.statusCode).toBe(400)
    expect(photos.photos).toHaveLength(0)
  })

  it('apaga o objeto e recusa quando o tipo real não é permitido', async () => {
    storage.metadata.set(storageKey, { size: 300_000, contentType: 'application/pdf' })

    const response = await useCase.execute('public-token-1', { storageKey, consentVersion: '1' })

    expect(response.statusCode).toBe(400)
    expect(storage.deleted).toContain(storageKey)
    expect(photos.photos).toHaveLength(0)
  })

  it('apaga o objeto e recusa quando o arquivo passa do tamanho máximo', async () => {
    storage.metadata.set(storageKey, {
      size: MAX_PHOTO_SIZE_BYTES + 1,
      contentType: 'image/jpeg',
    })

    const response = await useCase.execute('public-token-1', { storageKey, consentVersion: '1' })

    expect(response.statusCode).toBe(400)
    expect(storage.deleted).toContain(storageKey)
  })

  it('apaga o objeto e recusa arquivo menor que o mínimo', async () => {
    storage.metadata.set(storageKey, { size: 10, contentType: 'image/jpeg' })

    const response = await useCase.execute('public-token-1', { storageKey, consentVersion: '1' })

    expect(response.statusCode).toBe(400)
    expect(storage.deleted).toContain(storageKey)
  })
})
