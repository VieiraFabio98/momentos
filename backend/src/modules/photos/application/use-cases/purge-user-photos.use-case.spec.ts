import { describe, expect, it } from 'vitest'
import { makeEvent } from '../../../../../test/support/builders'
import { FakeEventRepository, FakeStorageProvider } from '../../../../../test/support/fakes'
import { PurgeUserPhotosUseCase } from './purge-user-photos.use-case'

describe('PurgeUserPhotosUseCase', () => {
  it('apaga o storage de todos os eventos do usuário e não encosta nos alheios', async () => {
    const events = new FakeEventRepository([
      makeEvent({ id: 'event-1', userId: 'user-1' }),
      makeEvent({ id: 'event-2', userId: 'user-1', publicToken: 'token-2' }),
      makeEvent({ id: 'event-3', userId: 'user-2', publicToken: 'token-3' }),
    ])
    const storage = new FakeStorageProvider()
    storage.objects.add('events/event-1/photos/a.jpg')
    storage.objects.add('events/event-2/photos/b.jpg')
    storage.objects.add('events/event-3/photos/c.jpg')

    const deleted = await new PurgeUserPhotosUseCase(events, storage).execute('user-1')

    expect(deleted).toBe(2)
    expect([...storage.objects]).toEqual(['events/event-3/photos/c.jpg'])
  })

  it('não quebra com usuário sem evento nenhum', async () => {
    const storage = new FakeStorageProvider()

    const deleted = await new PurgeUserPhotosUseCase(new FakeEventRepository(), storage).execute(
      'user-1',
    )

    expect(deleted).toBe(0)
  })
})
