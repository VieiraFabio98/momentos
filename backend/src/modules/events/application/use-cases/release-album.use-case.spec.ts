import { beforeEach, describe, expect, it } from 'vitest'
import { makeEvent } from '../../../../../test/support/builders'
import { FakeEventRepository } from '../../../../../test/support/fakes'
import {
  GetAlbumLinkUseCase,
  ReleaseAlbumUseCase,
  RevokeAlbumUseCase,
} from './release-album.use-case'

describe('Álbum curado do casal', () => {
  let events: FakeEventRepository

  beforeEach(() => {
    events = new FakeEventRepository([
      makeEvent({ id: 'event-1', userId: 'user-1' }),
      makeEvent({ id: 'event-2', userId: 'user-2' }),
    ])
  })

  const release = () => new ReleaseAlbumUseCase(events)
  const revoke = () => new RevokeAlbumUseCase(events)
  const link = () => new GetAlbumLinkUseCase(events)

  describe('ReleaseAlbumUseCase', () => {
    it('libera o álbum: gera token, marca liberado e devolve a URL', async () => {
      const response = await release().execute('user-1', 'event-1')

      expect(response.statusCode).toBe(200)
      expect(response.data.released).toBe(true)
      expect(response.data.albumUrl).toContain('/album/')
      expect(events.events[0].albumToken).toBeTruthy()
      expect(events.events[0].albumReleasedAt).toBeInstanceOf(Date)
    })

    it('é idempotente: re-liberar mantém o mesmo token', async () => {
      const first = await release().execute('user-1', 'event-1')
      const second = await release().execute('user-1', 'event-1')

      expect(second.data.albumUrl).toBe(first.data.albumUrl)
    })

    it('404 para evento de outro dono', async () => {
      const response = await release().execute('user-1', 'event-2')

      expect(response.statusCode).toBe(404)
      expect(events.events[1].albumToken).toBeNull()
    })
  })

  describe('RevokeAlbumUseCase', () => {
    it('derruba o link: zera token e liberação', async () => {
      await release().execute('user-1', 'event-1')
      const response = await revoke().execute('user-1', 'event-1')

      expect(response.data.released).toBe(false)
      expect(response.data.albumUrl).toBeNull()
      expect(events.events[0].albumToken).toBeNull()
      expect(events.events[0].albumReleasedAt).toBeNull()
    })

    it('após revogar, liberar de novo gera um token diferente', async () => {
      const first = await release().execute('user-1', 'event-1')
      await revoke().execute('user-1', 'event-1')
      const again = await release().execute('user-1', 'event-1')

      expect(again.data.albumUrl).not.toBe(first.data.albumUrl)
    })
  })

  describe('GetAlbumLinkUseCase', () => {
    it('reporta não liberado quando o álbum nunca foi liberado', async () => {
      const response = await link().execute('user-1', 'event-1')

      expect(response.data.released).toBe(false)
      expect(response.data.albumUrl).toBeNull()
    })
  })
})
