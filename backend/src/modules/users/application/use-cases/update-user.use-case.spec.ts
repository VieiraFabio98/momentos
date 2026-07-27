import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import { FakeHashProvider, FakeUserRepository } from '../../../../../test/support/fakes'
import { UpdateUserUseCase } from './update-user.use-case'

// o FakeHashProvider gera 'hashed:<senha>', então este é o hash de 'senha-atual'
const CURRENT_HASH = 'hashed:senha-atual'

describe('UpdateUserUseCase — senha atual', () => {
  let users: FakeUserRepository
  let sut: UpdateUserUseCase

  beforeEach(() => {
    users = new FakeUserRepository([
      makeUser({ id: 'user-1', email: 'ana@example.com', passwordHash: CURRENT_HASH }),
      makeUser({ id: 'user-2', email: 'ocupado@example.com', passwordHash: CURRENT_HASH }),
    ])
    sut = new UpdateUserUseCase(users, new FakeHashProvider())
  })

  it('troca a senha quando a senha atual confere', async () => {
    const response = await sut.execute('user-1', 'user-1', {
      password: 'senha-nova',
      currentPassword: 'senha-atual',
    })

    expect(response.statusCode).toBe(200)
    expect(users.users[0].passwordHash).toBe('hashed:senha-nova')
  })

  it('recusa troca de senha sem a senha atual', async () => {
    const response = await sut.execute('user-1', 'user-1', { password: 'senha-nova' })

    expect(response.statusCode).toBe(400)
    expect(users.users[0].passwordHash).toBe(CURRENT_HASH)
  })

  it('recusa troca de senha com a senha atual errada e aponta a recuperação por e-mail', async () => {
    const response = await sut.execute('user-1', 'user-1', {
      password: 'senha-nova',
      currentPassword: 'chute-errado',
    })

    expect(response.statusCode).toBe(400)
    expect(users.users[0].passwordHash).toBe(CURRENT_HASH)
    expect(JSON.stringify(response.data)).toContain('recuperação por e-mail')
  })

  // sem esta regra o cerco da senha seria contornável: troca-se o e-mail e
  // pede-se recuperação na caixa do invasor
  it('recusa troca de e-mail sem a senha atual', async () => {
    const response = await sut.execute('user-1', 'user-1', { email: 'invasor@example.com' })

    expect(response.statusCode).toBe(400)
    expect(users.users[0].email).toBe('ana@example.com')
  })

  it('troca o e-mail quando a senha atual confere', async () => {
    const response = await sut.execute('user-1', 'user-1', {
      email: 'ana.nova@example.com',
      currentPassword: 'senha-atual',
    })

    expect(response.statusCode).toBe(200)
    expect(users.users[0].email).toBe('ana.nova@example.com')
  })

  it('não pede senha atual para alterar só o nome', async () => {
    const response = await sut.execute('user-1', 'user-1', { name: 'Ana Maria' })

    expect(response.statusCode).toBe(200)
    expect(users.users[0].name).toBe('Ana Maria')
  })

  it('não pede senha atual de conta só-Google, que ainda não tem senha', async () => {
    users.users[0].passwordHash = null

    const response = await sut.execute('user-1', 'user-1', { password: 'primeira-senha' })

    expect(response.statusCode).toBe(200)
    expect(users.users[0].passwordHash).toBe('hashed:primeira-senha')
  })

  it('mantém o 409 de e-mail já cadastrado, agora depois da checagem de senha', async () => {
    const response = await sut.execute('user-1', 'user-1', {
      email: 'ocupado@example.com',
      currentPassword: 'senha-atual',
    })

    expect(response.statusCode).toBe(409)
    expect(users.users[0].email).toBe('ana@example.com')
  })
})
