import { Inject, Injectable } from '@nestjs/common'
import { createHash, randomBytes } from 'node:crypto'
import { HttpResponse, ok } from '../../../../shared/helpers'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../../users/domain/repositories/i-user-read-repository'
import { IMailProvider, MAIL_PROVIDER } from '../../domain/providers/i-mail-provider'
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../../domain/repositories/i-password-reset-token-repository'
import { ForgotPasswordDto } from '../dto/forgot-password.dto'

const RESPONSE_MESSAGE = 'Se o e-mail existir, você receberá um link de recuperação'

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: IMailProvider,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<HttpResponse> {
    const user = await this.userReadRepository.findByEmail(dto.email)
    if (!user) {
      return ok({ message: RESPONSE_MESSAGE })
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30)
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    await this.resetTokenRepository.create({ userId: user.id, tokenHash, expiresAt })

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const resetLink = `${frontendUrl}/reset-password?token=${token}`

    await this.mailProvider.send({
      to: user.email,
      subject: 'Momentos — recuperação de senha',
      html: `
        <p>Olá, ${user.name}!</p>
        <p>Recebemos um pedido para redefinir sua senha. O link vale por ${ttlMinutes} minutos:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Se não foi você, ignore este e-mail.</p>
      `,
    })

    return ok({ message: RESPONSE_MESSAGE })
  }
}
