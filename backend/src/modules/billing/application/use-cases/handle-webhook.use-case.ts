import { Inject, Injectable, Logger } from '@nestjs/common'
import { HttpResponse, ok, unauthorized } from '../../../../shared/helpers'
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

export interface IWebhookNotification {
  // tipo do evento MP; só 'subscription_preapproval' interessa aqui
  type: string | undefined
  // id do recurso (o preapproval), vindo de data.id
  dataId: string | undefined
  // cabeçalhos crus para validar a assinatura HMAC
  signature: string | undefined
  requestId: string | undefined
}

@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger('HandleWebhookUseCase')

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

  // Processa uma notificação do gateway. Fluxo defensivo: valida assinatura,
  // ignora eventos que não são de assinatura, e para qualquer coisa que não dê
  // para casar com uma linha nossa responde 200 mesmo assim (o MP reenvia em
  // não-2xx; loops de retry em evento não-processável não ajudam). A verdade do
  // status vem sempre de uma nova consulta ao gateway, nunca do corpo da request.
  async execute(notification: IWebhookNotification): Promise<HttpResponse> {
    const authentic = this.paymentProvider.verifyNotification({
      signature: notification.signature,
      requestId: notification.requestId,
      dataId: notification.dataId,
    })
    if (!authentic) {
      return unauthorized()
    }

    if (notification.type !== 'subscription_preapproval' || !notification.dataId) {
      // evento que não nos interessa (pagamento avulso, plano, etc.)
      return ok({ received: true })
    }

    const details = await this.paymentProvider.getPreapproval(notification.dataId)
    if (!details) {
      this.logger.warn(`Preapproval ${notification.dataId} não encontrado no gateway`)
      return ok({ received: true })
    }

    const subscription = await this.subscriptionReadRepository.findByProviderSubscriptionId(
      notification.dataId,
    )
    if (!subscription) {
      // preapproval sem linha local: pode ser criado fora do nosso fluxo. Loga e
      // segue — não há a quem espelhar o status.
      this.logger.warn(`Sem assinatura local para preapproval ${notification.dataId}`)
      return ok({ received: true })
    }

    await this.subscriptionWriteRepository.update(subscription.id, {
      status: details.status,
      currentPeriodEnd: details.currentPeriodEnd,
    })

    await this.userWriteRepository.update(subscription.userId, {
      subscriptionStatus: details.status,
    })

    this.logger.log(
      `Assinatura ${subscription.id} atualizada para ${details.status} (user ${subscription.userId})`,
    )

    return ok({ received: true })
  }
}
