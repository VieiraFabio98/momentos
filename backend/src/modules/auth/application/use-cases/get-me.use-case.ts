import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, notFound, ok } from '../../../../shared/helpers'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../../users/domain/repositories/i-user-read-repository'
import { UserResponseDto } from '../../../users/application/dto/user-response.dto'

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(userId: string): Promise<HttpResponse> {
    const user = await this.userReadRepository.findById(userId)
    if (!user) {
      return notFound('Usuário não encontrado')
    }
    return ok(UserResponseDto.fromDomain(user))
  }
}
