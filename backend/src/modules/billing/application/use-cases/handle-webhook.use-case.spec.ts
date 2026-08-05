import { beforeEach, describe, expect, it } from 'vitest'
import { makeSubscription, makeUser } from '../../../../../test/support/builders'
import {
  FakePaymentProvider,
  FakeSubscriptionRepository,
  FakeUserRepository,
} from '../../../../../test/support/fakes'
import { HandleWebhookUseCase } from './handle-webhook.use-case'

describe('HandleWebhookUseCase', () => {
  let users: FakeUserRepository
  let subscriptions: FakeSubscriptionRepository
  let payment: FakePaymentProvider
  let useCase: HandleWebhookUseCase

  const notification = (overrides = {}) => ({
    type: 'subscription_preapproval',
    dataId: 'mp-preapproval-1',
    signature: 'sig',
    requestId: 'req',
    ...overrides,
  })

  beforeEach(() => {
    users = new FakeUserRepository([makeUser({ id: 'user-1', subscriptionStatus: 'pending' })])
    subscriptions = new FakeSubscriptionRepository([
      makeSubscription({ id: 'sub-1', userId: 'user-1', providerSubscriptionId: 'mp-preapproval-1', status: 'pending' }),
    ])
    payment = new FakePaymentProvider()
    useCase = new HandleWebhookUseCase(subscriptions, subscriptions, users, payment)
  })

  it('401 quando a assinatura da notificação é inválida', async () => {
    payment.authentic = false

    const response = await useCase.execute(notification())

    expect(response.statusCode).toBe(401)
    expect(subscriptions.subscriptions[0].status).toBe('pending')
  })

  it('ignora (200) eventos que não são de assinatura', async () => {
    const response = await useCase.execute(notification({ type: 'payment' }))

    expect(response.statusCode).toBe(200)
    expect(subscriptions.subscriptions[0].status).toBe('pending')
  })

  it('vira status para active e espelha no usuário quando o gateway autoriza', async () => {
    const periodEnd = new Date('2026-09-01T00:00:00.000Z')
    payment.nextDetails = {
      providerSubscriptionId: 'mp-preapproval-1',
      status: 'active',
      externalReference: 'user-1',
      currentPeriodEnd: periodEnd,
    }

    const response = await useCase.execute(notification())

    expect(response.statusCode).toBe(200)
    expect(subscriptions.subscriptions[0].status).toBe('active')
    expect(subscriptions.subscriptions[0].currentPeriodEnd).toEqual(periodEnd)
    expect(users.users[0].subscriptionStatus).toBe('active')
  })

  it('reflete cancelamento vindo do gateway', async () => {
    payment.nextDetails = {
      providerSubscriptionId: 'mp-preapproval-1',
      status: 'canceled',
      externalReference: 'user-1',
      currentPeriodEnd: null,
    }

    await useCase.execute(notification())

    expect(subscriptions.subscriptions[0].status).toBe('canceled')
    expect(users.users[0].subscriptionStatus).toBe('canceled')
  })

  it('200 sem quebrar quando não há assinatura local para o preapproval', async () => {
    const response = await useCase.execute(notification({ dataId: 'desconhecido' }))

    expect(response.statusCode).toBe(200)
    expect(subscriptions.subscriptions[0].status).toBe('pending')
  })

  it('200 quando o gateway não encontra o preapproval', async () => {
    payment.nextDetails = null
    // força getPreapproval a devolver null
    payment.getPreapproval = async () => null

    const response = await useCase.execute(notification())

    expect(response.statusCode).toBe(200)
    expect(subscriptions.subscriptions[0].status).toBe('pending')
  })
})
