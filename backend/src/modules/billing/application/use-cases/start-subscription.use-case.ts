import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../../users/domain/repositories/i-user-read-repository'
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '../../../users/domain/repositories/i-user-write-repository'
import {
  IPaymentProvider,
  PAYMENT_PROVIDER,
} from '../../domain/providers/i-payment-provider'
import {
  ISubscriptionWriteRepository,
  SUBSCRIPTION_WRITE_REPOSITORY,
} from '../../domain/repositories/i-subscription-write-repository'
import { StartSubscriptionDto } from '../dto/start-subscription.dto'

@Injectable()
export class StartSubscriptionUseCase {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    @Inject(SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly subscriptionWriteRepository: ISubscriptionWriteRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  // Abre uma assinatura: cria o preapproval no gateway, grava a linha como
  // `pending` e devolve a URL de checkout. A confirmação de pagamento não vem
  // daqui — chega depois pelo webhook, que vira o status para `active`. O espelho
  // no user já entra como `pending` para o front refletir "aguardando pagamento".
  async execute(userId: string, dto: StartSubscriptionDto): Promise<HttpResponse> {
    const user = await this.userReadRepository.findById(userId)
    if (!user) {
      return notFound('Usuário não encontrado')
    }

    const { providerSubscriptionId, initPoint } = await this.paymentProvider.createPreapproval({
      plan: dto.plan,
      payerEmail: user.email,
      externalReference: userId,
    })

    await this.subscriptionWriteRepository.create({
      userId,
      plan: dto.plan,
      status: 'pending',
      providerSubscriptionId,
    })

    await this.userWriteRepository.update(userId, {
      subscriptionPlan: dto.plan,
      subscriptionStatus: 'pending',
    })

    return ok({ initPoint })
  }
}
