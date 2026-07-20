import { describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import {
  FakeMailProvider,
  FakeOAuthProvider,
  FakeTokenProvider,
  FakeUserRepository,
} from '../../../../../test/support/fakes'
import { GoogleLoginUseCase } from './google-login.use-case'

const GOOGLE_USER = { email: 'ana@example.com', name: 'Ana' }

function makeSut(googleUser = GOOGLE_USER as typeof GOOGLE_USER | null, existing: boolean = false) {
  const users = new FakeUserRepository(existing ? [makeUser()] : [])
  const mail = new FakeMailProvider()
  const useCase = new GoogleLoginUseCase(
    new FakeOAuthProvider(googleUser),
    users,
    new FakeTokenProvider(),
    mail,
  )
  return { useCase, users, mail }
}

describe('GoogleLoginUseCase', () => {
  it('cria a conta sem senha no primeiro login e envia boas-vindas', async () => {
    const { useCase, users, mail } = makeSut()

    const response = await useCase.execute({ idToken: 'id-token' })

    expect(response.statusCode).toBe(200)
    expect(users.users).toHaveLength(1)
    expect(users.users[0].passwordHash).toBeNull()
    expect(mail.sent).toHaveLength(1)
  })

  it('reaproveita a conta existente e não reenvia boas-vindas', async () => {
    const { useCase, users, mail } = makeSut(GOOGLE_USER, true)

    const response = await useCase.execute({ idToken: 'id-token' })

    expect(response.data.accessToken).toBe('token:user-1')
    expect(users.users).toHaveLength(1)
    expect(mail.sent).toHaveLength(0)
  })

  it('rejeita idToken inválido com 401', async () => {
    const { useCase, users } = makeSut(null)

    const response = await useCase.execute({ idToken: 'invalido' })

    expect(response.statusCode).toBe(401)
    expect(users.users).toHaveLength(0)
  })

  it('conclui o login mesmo se o e-mail de boas-vindas falhar', async () => {
    const { useCase, mail, users } = makeSut()
    mail.send = async () => {
      throw new Error('provedor fora do ar')
    }

    const response = await useCase.execute({ idToken: 'id-token' })

    expect(response.statusCode).toBe(200)
    expect(users.users).toHaveLength(1)
  })
})
