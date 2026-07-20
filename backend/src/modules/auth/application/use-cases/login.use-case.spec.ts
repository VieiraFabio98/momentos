import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import {
  FakeHashProvider,
  FakeTokenProvider,
  FakeUserRepository,
} from '../../../../../test/support/fakes'
import { LoginUseCase } from './login.use-case'

describe('LoginUseCase', () => {
  let users: FakeUserRepository
  let useCase: LoginUseCase

  beforeEach(() => {
    users = new FakeUserRepository([makeUser({ passwordHash: 'hashed:senha-correta' })])
    useCase = new LoginUseCase(users, new FakeHashProvider(), new FakeTokenProvider())
  })

  it('devolve token e usuário com credenciais válidas', async () => {
    const response = await useCase.execute({
      email: 'ana@example.com',
      password: 'senha-correta',
    })

    expect(response.statusCode).toBe(200)
    expect(response.data.accessToken).toBe('token:user-1')
    expect(response.data.user.email).toBe('ana@example.com')
  })

  it('nunca expõe o hash da senha na resposta', async () => {
    const response = await useCase.execute({
      email: 'ana@example.com',
      password: 'senha-correta',
    })

    expect(response.data.user).not.toHaveProperty('passwordHash')
  })

  it('rejeita senha errada com 401', async () => {
    const response = await useCase.execute({ email: 'ana@example.com', password: 'errada' })

    expect(response.statusCode).toBe(401)
  })

  it('rejeita e-mail inexistente com 401, sem distinguir do caso acima', async () => {
    const response = await useCase.execute({
      email: 'ninguem@example.com',
      password: 'senha-correta',
    })

    expect(response.statusCode).toBe(401)
  })

  it('rejeita login por senha em conta criada via Google (sem hash)', async () => {
    users.users = [makeUser({ passwordHash: null })]

    const response = await useCase.execute({ email: 'ana@example.com', password: 'qualquer' })

    expect(response.statusCode).toBe(401)
  })
})
