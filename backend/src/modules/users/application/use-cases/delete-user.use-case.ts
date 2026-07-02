import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, noContent, notFound } from '../../../../shared/helpers'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user-repository'

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<HttpResponse> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }
    await this.userRepository.delete(id)
    return noContent()
  }
}
