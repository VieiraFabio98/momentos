import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, noContent, notFound } from '../../../../shared/helpers'
import { PurgeUserPhotosUseCase } from '../../../photos/application/use-cases/purge-user-photos.use-case'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user-repository'

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly purgeUserPhotos: PurgeUserPhotosUseCase,
  ) {}

  async execute(currentUserId: string, id: string): Promise<HttpResponse> {
    if (id !== currentUserId) {
      return notFound('Usuário não encontrado')
    }

    const user = await this.userRepository.findById(id)
    if (!user) {
      return notFound('Usuário não encontrado')
    }

    // "ao excluir a conta, apagamos tudo o que estiver vinculado a ela" — o
    // banco cai por cascade, mas as fotos no storage não têm cascade nenhum.
    // Tem que sair antes: depois do delete não existe mais registro de onde
    // elas estão, e nada no sistema conseguiria encontrá-las de novo.
    await this.purgeUserPhotos.execute(id)
    await this.userRepository.delete(id)
    return noContent()
  }
}
