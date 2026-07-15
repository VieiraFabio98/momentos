import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, ok, unauthorized } from '../../../../shared/helpers'
import { HASH_PROVIDER, IHashProvider } from '../../../users/domain/providers/i-hash-provider'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../../users/domain/repositories/i-user-read-repository'
import { UserResponseDto } from '../../../users/application/dto/user-response.dto'
import { ITokenProvider, TOKEN_PROVIDER } from '../../domain/providers/i-token-provider'
import { LoginDto } from '../dto/login.dto'

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(TOKEN_PROVIDER)
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(dto: LoginDto): Promise<HttpResponse> {
    const user = await this.userReadRepository.findByEmail(dto.email)
    if (!user || user.passwordHash === null) {
      return unauthorized()
    }

    const passwordMatches = await this.hashProvider.compare(dto.password, user.passwordHash)
    if (!passwordMatches) {
      return unauthorized()
    }

    const accessToken = await this.tokenProvider.sign({ sub: user.id, email: user.email })

    return ok({
      accessToken,
      user: UserResponseDto.fromDomain(user),
    })
  }
}
