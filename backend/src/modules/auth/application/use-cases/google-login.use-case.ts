import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, ok, unauthorized } from '../../../../shared/helpers'
import { UserResponseDto } from '../../../users/application/dto/user-response.dto'
import { IUserRepository, USER_REPOSITORY } from '../../../users/domain/repositories/i-user-repository'
import { IOAuthProvider, OAUTH_PROVIDER } from '../../domain/providers/i-oauth-provider'
import { ITokenProvider, TOKEN_PROVIDER } from '../../domain/providers/i-token-provider'
import { GoogleLoginDto } from '../dto/google-login.dto'

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    @Inject(OAUTH_PROVIDER)
    private readonly oauthProvider: IOAuthProvider,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TOKEN_PROVIDER)
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(dto: GoogleLoginDto): Promise<HttpResponse> {
    const googleUser = await this.oauthProvider.verifyIdToken(dto.idToken)
    if (!googleUser) {
      return unauthorized()
    }

    let user = await this.userRepository.findByEmail(googleUser.email)
    if (!user) {
      user = await this.userRepository.create({
        name: googleUser.name,
        email: googleUser.email,
        passwordHash: null,
      })
    }

    const accessToken = await this.tokenProvider.sign({ sub: user.id, email: user.email })

    return ok({
      accessToken,
      user: UserResponseDto.fromDomain(user),
    })
  }
}
