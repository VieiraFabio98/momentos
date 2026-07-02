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

  async execute(id: string): Promise<HttpResponse> {
    const user = await this.userReadRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }
    return ok(UserResponseDto.fromDomain(user))
  }
}
