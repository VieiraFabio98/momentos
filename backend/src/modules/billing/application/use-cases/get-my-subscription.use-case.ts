import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, ok } from '../../../../shared/helpers'
import {
  ISubscriptionReadRepository,
  SUBSCRIPTION_READ_REPOSITORY,
} from '../../domain/repositories/i-subscription-read-repository'
import { SubscriptionResponseDto } from '../dto/subscription-response.dto'

@Injectable()
export class GetMySubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_READ_REPOSITORY)
    private readonly subscriptionReadRepository: ISubscriptionReadRepository,
  ) {}

  // Assinatura mais recente da conta, ou null se nunca assinou. O front faz poll
  // disto na tela de retorno até o status virar `active` (webhook processado).
  async execute(userId: string): Promise<HttpResponse> {
    const subscription = await this.subscriptionReadRepository.findLatestByUserId(userId)
    return ok(subscription ? SubscriptionResponseDto.fromDomain(subscription) : null)
  }
}
