import { Inject, Injectable } from '@nestjs/common'
import { conflictError, HttpResponse, notFound, ok } from '../../../../shared/helpers'
import { HASH_PROVIDER, IHashProvider } from '../../domain/providers/i-hash-provider'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user-repository'
import { IUpdateUserData } from '../../domain/repositories/i-user-write-repository'
import { UpdateUserDto } from '../dto/update-user.dto'
import { UserResponseDto } from '../dto/user-response.dto'

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<HttpResponse> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email)
      if (existing) {
        return conflictError('E-mail já cadastrado')
      }
    }

    const data: IUpdateUserData = {
      name: dto.name,
      email: dto.email,
    }
    if (dto.password) {
      data.passwordHash = await this.hashProvider.hash(dto.password)
    }

    const updated = await this.userRepository.update(id, data)
    return ok(UserResponseDto.fromDomain(updated))
  }
}
