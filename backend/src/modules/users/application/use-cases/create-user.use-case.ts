import { Inject, Injectable, Logger } from '@nestjs/common'
import { conflictError, created, HttpResponse } from '../../../../shared/helpers'
import { IMailProvider, MAIL_PROVIDER } from '../../../mail/domain/i-mail-provider'
import { HASH_PROVIDER, IHashProvider } from '../../domain/providers/i-hash-provider'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user-repository'
import { CreateUserDto } from '../dto/create-user.dto'
import { UserResponseDto } from '../dto/user-response.dto'

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger('CreateUserUseCase')

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: IMailProvider,
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

    await this.sendWelcomeEmail(user.name, user.email)

    return created(UserResponseDto.fromDomain(user))
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
