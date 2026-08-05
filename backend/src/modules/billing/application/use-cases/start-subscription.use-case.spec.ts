import { beforeEach, describe, expect, it } from 'vitest'
import { makeUser } from '../../../../../test/support/builders'
import {
  FakePaymentProvider,
  FakeSubscriptionRepository,
  FakeUserRepository,
} from '../../../../../test/support/fakes'
import { StartSubscriptionUseCase } from './start-subscription.use-case'

describe('StartSubscriptionUseCase', () => {
  let users: FakeUserRepository
  let subscriptions: FakeSubscriptionRepository
  let payment: FakePaymentProvider
  let useCase: StartSubscriptionUseCase

  beforeEach(() => {
    users = new FakeUserRepository([makeUser({ id: 'user-1', email: 'ana@example.com' })])
    subscriptions = new FakeSubscriptionRepository()
    payment = new FakePaymentProvider()
    useCase = new StartSubscriptionUseCase(users, users, subscriptions, payment)
  })

  it('cria preapproval com o email do usuário e devolve o initPoint', async () => {
    const response = await useCase.execute('user-1', { plan: 'mensal' })

    expect(response.statusCode).toBe(200)
    expect(response.data.initPoint).toContain('checkout')
    expect(payment.created[0]).toMatchObject({
      plan: 'mensal',
      payerEmail: 'ana@example.com',
      externalReference: 'user-1',
    })
  })

  it('grava a assinatura local como pending', async () => {
    await useCase.execute('user-1', { plan: 'anual' })

    expect(subscriptions.subscriptions).toHaveLength(1)
    expect(subscriptions.subscriptions[0]).toMatchObject({
      userId: 'user-1',
      plan: 'anual',
      status: 'pending',
    })
  })

  it('espelha plano e status pending no usuário', async () => {
    await useCase.execute('user-1', { plan: 'mensal' })

    expect(users.users[0].subscriptionPlan).toBe('mensal')
    expect(users.users[0].subscriptionStatus).toBe('pending')
  })

  it('404 quando o usuário não existe', async () => {
    const response = await useCase.execute('ghost', { plan: 'mensal' })

    expect(response.statusCode).toBe(404)
    expect(payment.created).toHaveLength(0)
    expect(subscriptions.subscriptions).toHaveLength(0)
  })
})
