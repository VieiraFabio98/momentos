import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user-repository'
import { SetSubscriptionDto } from '../dto/set-subscription.dto'
import { UserResponseDto } from '../dto/user-response.dto'

@Injectable()
export class SetSubscriptionUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  // grava o plano escolhido na conta. Sem gateway: não há cobrança nem status de
  // pagamento — só registra a escolha (mensal|anual). 404 para conta alheia,
  // seguindo o módulo (não vaza existência de outra conta).
  async execute(
    currentUserId: string,
    id: string,
    dto: SetSubscriptionDto,
  ): Promise<HttpResponse> {
    if (id !== currentUserId) {
      return notFound('Usuário não encontrado')
    }

    const user = await this.userRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }

    const updated = await this.userRepository.update(id, { subscriptionPlan: dto.plan })

    return ok(UserResponseDto.fromDomain(updated))
  }
}
