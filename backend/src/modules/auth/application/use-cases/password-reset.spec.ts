import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import {
  FakeHashProvider,
  FakeMailProvider,
  FakePasswordResetTokenRepository,
  FakeUserRepository,
} from '../../../../../test/support/fakes'
import { ForgotPasswordUseCase } from './forgot-password.use-case'
import { ResetPasswordUseCase } from './reset-password.use-case'

const GENERIC_MESSAGE = 'Se o e-mail existir, você receberá um link de recuperação'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

describe('ForgotPasswordUseCase', () => {
  let users: FakeUserRepository
  let tokens: FakePasswordResetTokenRepository
  let mail: FakeMailProvider
  let useCase: ForgotPasswordUseCase

  beforeEach(() => {
    users = new FakeUserRepository([makeUser()])
    tokens = new FakePasswordResetTokenRepository()
    mail = new FakeMailProvider()
    useCase = new ForgotPasswordUseCase(users, tokens, mail)
  })

  it('envia o link com o token em claro e guarda apenas o hash', async () => {
    await useCase.execute({ email: 'ana@example.com' })

    const link = mail.sent[0].html.match(/reset-password\?token=([0-9a-f]+)/)
    expect(link).not.toBeNull()

    const plainToken = link![1]
    expect(tokens.tokens[0].tokenHash).toBe(sha256(plainToken))
    expect(tokens.tokens[0].tokenHash).not.toBe(plainToken)
  })

  it('responde igual para e-mail inexistente e não envia e-mail (evita enumeração)', async () => {
    const response = await useCase.execute({ email: 'ninguem@example.com' })

    expect(response.statusCode).toBe(200)
    expect(response.data.message).toBe(GENERIC_MESSAGE)
    expect(mail.sent).toHaveLength(0)
    expect(tokens.tokens).toHaveLength(0)
  })
})

describe('ResetPasswordUseCase', () => {
  const plainToken = 'token-em-claro'

  let users: FakeUserRepository
  let tokens: FakePasswordResetTokenRepository
  let useCase: ResetPasswordUseCase

  beforeEach(async () => {
    users = new FakeUserRepository([makeUser({ passwordHash: 'hashed:senha-antiga' })])
    tokens = new FakePasswordResetTokenRepository()
    await tokens.create({
      userId: 'user-1',
      tokenHash: sha256(plainToken),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    useCase = new ResetPasswordUseCase(tokens, users, new FakeHashProvider())
  })

  it('troca a senha e marca o token como usado', async () => {
    const response = await useCase.execute({ token: plainToken, password: 'senha-nova' })

    expect(response.statusCode).toBe(200)
    expect(users.users[0].passwordHash).toBe('hashed:senha-nova')
    expect(tokens.tokens[0].usedAt).not.toBeNull()
  })

  it('recusa reuso do mesmo token', async () => {
    await useCase.execute({ token: plainToken, password: 'senha-nova' })

    const response = await useCase.execute({ token: plainToken, password: 'outra-senha' })

    expect(response.statusCode).toBe(400)
    expect(users.users[0].passwordHash).toBe('hashed:senha-nova')
  })

  it('recusa token expirado', async () => {
    tokens.tokens[0].expiresAt = new Date(Date.now() - 1000)

    const response = await useCase.execute({ token: plainToken, password: 'senha-nova' })

    expect(response.statusCode).toBe(400)
    expect(users.users[0].passwordHash).toBe('hashed:senha-antiga')
  })

  it('recusa token inexistente', async () => {
    const response = await useCase.execute({ token: 'inventado', password: 'senha-nova' })

    expect(response.statusCode).toBe(400)
  })
})
