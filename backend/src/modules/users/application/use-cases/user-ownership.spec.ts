import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import { FakeHashProvider, FakeUserRepository } from '../../../../../test/support/fakes'
import { DeleteUserUseCase } from './delete-user.use-case'
import { GetUserUseCase } from './get-user.use-case'
import { UpdateUserUseCase } from './update-user.use-case'

// duas contas, p/ provar que uma não alcança a outra mesmo com token válido
const OWN_USER = makeUser({ id: 'user-1', email: 'ana@example.com' })
const OTHER_USER = makeUser({ id: 'user-2', name: 'Bia', email: 'bia@example.com' })

describe('Usuários — só a própria conta', () => {
  let users: FakeUserRepository
  let hash: FakeHashProvider

  beforeEach(() => {
    users = new FakeUserRepository([{ ...OWN_USER }, { ...OTHER_USER }])
    hash = new FakeHashProvider()
  })

  describe('GetUserUseCase', () => {
    it('devolve a própria conta', async () => {
      const response = await new GetUserUseCase(users).execute('user-1', 'user-1')

      expect(response.statusCode).toBe(200)
      expect(response.data.email).toBe('ana@example.com')
    })

    it('devolve 404 (não 403) para conta alheia, sem vazar existência', async () => {
      const response = await new GetUserUseCase(users).execute('user-1', 'user-2')

      expect(response.statusCode).toBe(404)
      expect(response.data).not.toHaveProperty('email')
    })
  })

  describe('UpdateUserUseCase', () => {
    it('atualiza os próprios dados', async () => {
      const response = await new UpdateUserUseCase(users, hash).execute('user-1', 'user-1', {
        name: 'Ana Maria',
      })

      expect(response.statusCode).toBe(200)
      expect(users.users[0].name).toBe('Ana Maria')
    })

    it('não altera conta alheia — nem e-mail, nem senha', async () => {
      const response = await new UpdateUserUseCase(users, hash).execute('user-1', 'user-2', {
        email: 'invasor@example.com',
        password: 'senha-nova',
      })

      expect(response.statusCode).toBe(404)
      expect(users.users[1].email).toBe('bia@example.com')
      expect(users.users[1].passwordHash).toBe(OTHER_USER.passwordHash)
    })
  })

  describe('DeleteUserUseCase', () => {
    // excluir a conta apaga também as fotos no storage; aqui só interessa o
    // ownership, então a limpeza entra dublada — ela tem spec própria
    const makeDeleteUser = () =>
      new DeleteUserUseCase(users, { execute: async () => 0 } as never)

    it('exclui a própria conta', async () => {
      const response = await makeDeleteUser().execute('user-1', 'user-1')

      expect(response.statusCode).toBe(204)
      expect(users.users.map((user) => user.id)).toEqual(['user-2'])
    })

    it('não exclui conta alheia', async () => {
      const response = await makeDeleteUser().execute('user-1', 'user-2')

      expect(response.statusCode).toBe(404)
      expect(users.users).toHaveLength(2)
    })

    // a ordem é o que importa: apagada a conta, o cascade leva os eventos e as
    // fotos, e ninguém mais sabe quais objetos do bucket eram daquela conta
    it('apaga as fotos do storage antes de remover a conta do banco', async () => {
      const ordem: string[] = []
      const purge = {
        execute: async () => {
          ordem.push('storage')
          return 2
        },
      }
      const remove = users.delete.bind(users)
      users.delete = async (id: string) => {
        ordem.push('banco')
        return remove(id)
      }

      await new DeleteUserUseCase(users, purge as never).execute('user-1', 'user-1')

      expect(ordem).toEqual(['storage', 'banco'])
    })

    it('não apaga storage nenhum ao recusar conta alheia', async () => {
      let chamou = false
      const purge = {
        execute: async () => {
          chamou = true
          return 0
        },
      }

      await new DeleteUserUseCase(users, purge as never).execute('user-1', 'user-2')

      expect(chamou).toBe(false)
    })
  })
})
