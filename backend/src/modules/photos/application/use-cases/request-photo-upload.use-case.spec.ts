import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent, makePhoto } from '../../../../../test/support/builders'
import { FakeEventRepository, FakePhotoRepository, FakeStorageProvider } from '../../../../../test/support/fakes'
import { MAX_PHOTO_SIZE_BYTES } from '../dto/request-photo-upload.dto'
import { RequestPhotoUploadUseCase } from './request-photo-upload.use-case'

describe('RequestPhotoUploadUseCase', () => {
  let events: FakeEventRepository
  let photos: FakePhotoRepository
  let storage: FakeStorageProvider
  let useCase: RequestPhotoUploadUseCase

  const validDto = { contentType: 'image/jpeg' as const, size: 300_000 }

  beforeEach(() => {
    events = new FakeEventRepository([makeEvent()])
    photos = new FakePhotoRepository()
    storage = new FakeStorageProvider()
    useCase = new RequestPhotoUploadUseCase(events, photos, storage)
  })

  it('devolve url assinada e storageKey dentro do prefixo do evento', async () => {
    const response = await useCase.execute('public-token-1', validDto)

    expect(response.statusCode).toBe(200)
    expect(response.data.storageKey).toMatch(/^events\/event-1\/photos\/[\w-]+\.jpg$/)
    expect(response.data.uploadUrl).toContain('size=300000')
  })

  it('usa a extensão correspondente ao contentType', async () => {
    const response = await useCase.execute('public-token-1', {
      contentType: 'image/webp',
      size: 500_000,
    })

    expect(response.data.storageKey.endsWith('.webp')).toBe(true)
  })

  it('retorna 404 quando o token público não existe', async () => {
    const response = await useCase.execute('token-inexistente', validDto)

    expect(response.statusCode).toBe(404)
  })

  it('retorna 403 quando a janela do evento ainda não abriu', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000)
    events.events = [makeEvent({ opensAt: future, expiresAt: new Date(future.getTime() + 1000) })]

    const response = await useCase.execute('public-token-1', validDto)

    expect(response.statusCode).toBe(403)
  })

  it('retorna 403 quando a janela do evento já fechou', async () => {
    events.events = [makeEvent({ status: 'expired' })]

    const response = await useCase.execute('public-token-1', validDto)

    expect(response.statusCode).toBe(403)
  })

  it('bloqueia o plano degustação ao atingir 30 fotos', async () => {
    events.events = [makeEvent({ plan: 'degustacao' })]
    photos.photos = Array.from({ length: 30 }, (_, index) =>
      makePhoto({ id: `photo-${index}` }),
    )

    const response = await useCase.execute('public-token-1', validDto)

    expect(response.statusCode).toBe(400)
  })

  it('não aplica limite de fotos nos planos pagos', async () => {
    events.events = [makeEvent({ plan: 'memoria' })]
    photos.photos = Array.from({ length: 500 }, (_, index) => makePhoto({ id: `photo-${index}` }))

    const response = await useCase.execute('public-token-1', validDto)

    expect(response.statusCode).toBe(200)
  })

  it('assina a url com o tamanho informado para o S3 recusar upload maior', async () => {
    const response = await useCase.execute('public-token-1', {
      contentType: 'image/jpeg',
      size: MAX_PHOTO_SIZE_BYTES,
    })

    expect(response.data.uploadUrl).toContain(`size=${MAX_PHOTO_SIZE_BYTES}`)
  })
})
