import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { CreateUserDto } from '../../application/dto/create-user.dto'
import { UpdateUserDto } from '../../application/dto/update-user.dto'
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case'
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case'
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case'
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case'
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case'

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<HttpResponse> {
    return this.createUserUseCase.execute(dto)
  }

  @Get()
  findAll(): Promise<HttpResponse> {
    return this.listUsersUseCase.execute()
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<HttpResponse> {
    return this.getUserUseCase.execute(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<HttpResponse> {
    return this.updateUserUseCase.execute(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<HttpResponse> {
    return this.deleteUserUseCase.execute(id)
  }
}
