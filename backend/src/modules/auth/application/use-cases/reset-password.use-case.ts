import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { badRequest, HttpResponse, ok } from '../../../../shared/helpers'
import { HASH_PROVIDER, IHashProvider } from '../../../users/domain/providers/i-hash-provider'
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '../../../users/domain/repositories/i-user-write-repository'
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../../domain/repositories/i-password-reset-token-repository'
import { ResetPasswordDto } from '../dto/reset-password.dto'

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<HttpResponse> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex')

    const resetToken = await this.resetTokenRepository.findValidByTokenHash(tokenHash)
    if (!resetToken) {
      return badRequest('Token inválido ou expirado')
    }

    const passwordHash = await this.hashProvider.hash(dto.password)
    await this.userWriteRepository.update(resetToken.userId, { passwordHash })
    await this.resetTokenRepository.markUsed(resetToken.id)

    return ok({ message: 'Senha redefinida com sucesso' })
  }
}
