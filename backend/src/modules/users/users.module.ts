import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HASH_PROVIDER } from './domain/providers/i-hash-provider'
import { USER_READ_REPOSITORY } from './domain/repositories/i-user-read-repository'
import { USER_REPOSITORY } from './domain/repositories/i-user-repository'
import { USER_WRITE_REPOSITORY } from './domain/repositories/i-user-write-repository'
import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case'
import { GetUserUseCase } from './application/use-cases/get-user.use-case'
import { ListUsersUseCase } from './application/use-cases/list-users.use-case'
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case'
import { UsersController } from './infra/controllers/users.controller'
import { UserEntity } from './infra/entities/user.entity'
import { BcryptHashProvider } from './infra/providers/bcrypt-hash.provider'
import { TypeormUserRepository } from './infra/repositories/typeorm-user.repository'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [
    TypeormUserRepository,
    { provide: USER_REPOSITORY, useExisting: TypeormUserRepository },
    { provide: USER_READ_REPOSITORY, useExisting: TypeormUserRepository },
    { provide: USER_WRITE_REPOSITORY, useExisting: TypeormUserRepository },
    { provide: HASH_PROVIDER, useClass: BcryptHashProvider },
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [USER_REPOSITORY, USER_READ_REPOSITORY, USER_WRITE_REPOSITORY, HASH_PROVIDER],
})
export class UsersModule {}
