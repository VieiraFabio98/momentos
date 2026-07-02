import { Inject, Injectable } from '@nestjs/common'
import { HttpResponse, ok } from '../../../../shared/helpers'
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '../../domain/repositories/i-user-read-repository'
import { UserResponseDto } from '../dto/user-response.dto'

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(): Promise<HttpResponse> {
    const users = await this.userReadRepository.findAll()
    return ok(users.map(UserResponseDto.fromDomain))
  }
}
