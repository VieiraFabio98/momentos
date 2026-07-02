import { Inject, Injectable } from '@nestjs/common'
import { conflictError, created, HttpResponse } from '../../../../shared/helpers'
import { HASH_PROVIDER, IHashProvider } from '../../domain/providers/i-hash-provider'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user-repository'
import { CreateUserDto } from '../dto/create-user.dto'
import { UserResponseDto } from '../dto/user-response.dto'

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(dto: CreateUserDto): Promise<HttpResponse> {
    const existing = await this.userRepository.findByEmail(dto.email)
    if (existing) {
      return conflictError('E-mail já cadastrado')
    }

    const passwordHash = await this.hashProvider.hash(dto.password)
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    })

    return created(UserResponseDto.fromDomain(user))
  }
}
