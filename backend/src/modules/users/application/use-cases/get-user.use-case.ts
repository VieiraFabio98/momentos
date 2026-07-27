import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../domain/repositories/i-user-read-repository'
import { UserResponseDto } from '../dto/user-response.dto'

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  // 404 (não 403) para conta alheia: o mesmo corpo de resposta de um id
  // inexistente, então a rota não vira sonda de "esse id existe?"
  async execute(currentUserId: string, id: string): Promise<HttpResponse> {
    if (id !== currentUserId) {
      return notFound('Usuário não encontrado')
    }

    const user = await this.userReadRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }
    return ok(UserResponseDto.fromDomain(user))
  }
}
