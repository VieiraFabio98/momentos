import { Inject, Injectable } from '@nestjs/common'
import { badRequest, conflictError, HttpResponse, notFound, ok } from '../../../../shared/helpers'
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

  async execute(currentUserId: string, id: string, dto: UpdateUserDto): Promise<HttpResponse> {
    if (id !== currentUserId) {
      return notFound('Usuário não encontrado')
    }

    const user = await this.userRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }

    const changingPassword = Boolean(dto.password)
    const changingEmail = Boolean(dto.email && dto.email !== user.email)

    // Trocar senha OU e-mail exige provar que sabe a senha atual: sem isso, um
    // token roubado troca a senha (dono perde a conta) ou troca o e-mail e pede
    // recuperação por fora — o que anularia a checagem da senha.
    // Contas só-Google não têm senha p/ conferir; aí o JWT é a única credencial.
    if ((changingPassword || changingEmail) && user.passwordHash !== null) {
      if (!dto.currentPassword) {
        return badRequest('Informe a senha atual para alterar senha ou e-mail')
      }

      const currentPasswordMatches = await this.hashProvider.compare(
        dto.currentPassword,
        user.passwordHash,
      )
      if (!currentPasswordMatches) {
        // sem citar o nome do link: o texto aparece tanto no login quanto na
        // tela de perfil, e cada uma chama a recuperação de um jeito
        return badRequest('Senha atual incorreta. Se não lembra, peça o link de recuperação por e-mail')
      }
    }

    if (changingEmail) {
      const existing = await this.userRepository.findByEmail(dto.email!)
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
