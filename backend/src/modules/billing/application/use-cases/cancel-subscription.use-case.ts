import { Inject, Injectable } from '@nestjs/common'
import { badRequest, HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '../../../users/domain/repositories/i-user-write-repository'
import {
  IPaymentProvider,
  PAYMENT_PROVIDER,
} from '../../domain/providers/i-payment-provider'
import {
  ISubscriptionReadRepository,
  SUBSCRIPTION_READ_REPOSITORY,
} from '../../domain/repositories/i-subscription-read-repository'
import {
  ISubscriptionWriteRepository,
  SUBSCRIPTION_WRITE_REPOSITORY,
} from '../../domain/repositories/i-subscription-write-repository'
import { SubscriptionResponseDto } from '../dto/subscription-response.dto'

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_READ_REPOSITORY)
    private readonly subscriptionReadRepository: ISubscriptionReadRepository,
    @Inject(SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly subscriptionWriteRepository: ISubscriptionWriteRepository,
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  // Cancela no gateway e espelha localmente. Cancelar já reflete o status na hora
  // (não espera o webhook) para o front dar feedback imediato — mas o webhook de
  // cancelamento, quando chega, apenas reconfirma o mesmo estado (idempotente).
  async execute(userId: string): Promise<HttpResponse> {
    const subscription = await this.subscriptionReadRepository.findLatestByUserId(userId)
    if (!subscription) {
      return notFound('Assinatura não encontrada')
    }
    if (subscription.status === 'canceled') {
      return badRequest('Assinatura já cancelada')
    }

    await this.paymentProvider.cancel(subscription.providerSubscriptionId)

    const updated = await this.subscriptionWriteRepository.update(subscription.id, {
      status: 'canceled',
    })
    await this.userWriteRepository.update(userId, { subscriptionStatus: 'canceled' })

    return ok(SubscriptionResponseDto.fromDomain(updated))
  }
}
