import { Inject, Injectable, Logger } from '@nestjs/common'
import { HttpResponse, ok, unauthorized } from '../../../../shared/helpers'
import { IMailProvider, MAIL_PROVIDER } from '../../../mail/domain/i-mail-provider'
import { UserResponseDto } from '../../../users/application/dto/user-response.dto'
import { IUserRepository, USER_REPOSITORY } from '../../../users/domain/repositories/i-user-repository'
import { IOAuthProvider, OAUTH_PROVIDER } from '../../domain/providers/i-oauth-provider'
import { ITokenProvider, TOKEN_PROVIDER } from '../../domain/providers/i-token-provider'
import { GoogleLoginDto } from '../dto/google-login.dto'

@Injectable()
export class GoogleLoginUseCase {
  private readonly logger = new Logger('GoogleLoginUseCase')

  constructor(
    @Inject(OAUTH_PROVIDER)
    private readonly oauthProvider: IOAuthProvider,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TOKEN_PROVIDER)
    private readonly tokenProvider: ITokenProvider,
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: IMailProvider,
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
      await this.sendWelcomeEmail(user.name, user.email)
    }

    const accessToken = await this.tokenProvider.sign({ sub: user.id, email: user.email })

    return ok({
      accessToken,
      user: UserResponseDto.fromDomain(user),
    })
  }

  private async sendWelcomeEmail(name: string, email: string): Promise<void> {
    try {
      await this.mailProvider.send({
        to: email,
        subject: 'Bem-vindo ao Momentos ✨',
        html: `
          <p>Olá, ${name}!</p>
          <p>Sua conta no <strong>Momentos</strong> foi criada com sucesso.</p>
          <p>Agora é só criar seu evento, gerar o QR Code e deixar que os convidados
          capturem cada momento do grande dia.</p>
          <p>Com carinho,<br />Equipe Momentos</p>
        `,
      })
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail de boas-vindas para ${email}`, error as Error)
    }
  }
}
