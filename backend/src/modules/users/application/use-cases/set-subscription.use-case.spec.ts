import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import { FakeUserRepository } from '../../../../../test/support/fakes'
import { SetSubscriptionUseCase } from './set-subscription.use-case'

describe('SetSubscriptionUseCase', () => {
  let users: FakeUserRepository
  let useCase: SetSubscriptionUseCase

  beforeEach(() => {
    users = new FakeUserRepository([makeUser({ id: 'user-1', subscriptionPlan: null })])
    useCase = new SetSubscriptionUseCase(users)
  })

  it('grava o plano mensal na conta', async () => {
    const response = await useCase.execute('user-1', 'user-1', { plan: 'mensal' })

    expect(response.statusCode).toBe(200)
    expect(response.data.subscriptionPlan).toBe('mensal')
    expect(users.users[0].subscriptionPlan).toBe('mensal')
  })

  it('troca o plano para anual', async () => {
    users.users[0].subscriptionPlan = 'mensal'

    const response = await useCase.execute('user-1', 'user-1', { plan: 'anual' })

    expect(response.data.subscriptionPlan).toBe('anual')
  })

  it('404 ao tentar assinar para outra conta', async () => {
    const response = await useCase.execute('user-1', 'user-2', { plan: 'mensal' })

    expect(response.statusCode).toBe(404)
    expect(users.users[0].subscriptionPlan).toBeNull()
  })
})
