import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import {
  FakeEventRepository,
  FakeMailProvider,
  FakeUserRepository,
} from '../../../../../test/support/fakes'
import { CreateEventUseCase } from './create-event.use-case'

describe('CreateEventUseCase', () => {
  let events: FakeEventRepository
  let users: FakeUserRepository
  let mail: FakeMailProvider
  let useCase: CreateEventUseCase

  const dto = { title: 'Ana & João', eventDate: '2026-06-20', plan: 'momento' as const }

  beforeEach(() => {
    events = new FakeEventRepository()
    users = new FakeUserRepository([makeUser()])
    mail = new FakeMailProvider()
    useCase = new CreateEventUseCase(events, users, mail)
  })

  it('cria o evento com token público gerado', async () => {
    const response = await useCase.execute('user-1', dto)

    expect(response.statusCode).toBe(201)
    expect(events.events).toHaveLength(1)
    expect(response.data.publicToken).toMatch(/^[0-9a-f]{32}$/)
  })

  it('deriva a janela de 16 horas a partir de opensAt', async () => {
    const response = await useCase.execute('user-1', {
      ...dto,
      opensAt: '2026-06-20T18:00:00.000Z',
    })

    expect(response.data.expiresAt?.toISOString()).toBe('2026-06-21T10:00:00.000Z')
  })

  it('envia e-mail de confirmação para o casal', async () => {
    await useCase.execute('user-1', dto)

    expect(mail.sent).toHaveLength(1)
    expect(mail.sent[0].to).toBe('ana@example.com')
    expect(mail.sent[0].subject).toContain('Ana & João')
  })

  it('cria o evento mesmo se o envio de e-mail falhar', async () => {
    mail.send = async () => {
      throw new Error('provedor fora do ar')
    }

    const response = await useCase.execute('user-1', dto)

    expect(response.statusCode).toBe(201)
    expect(events.events).toHaveLength(1)
  })
})
