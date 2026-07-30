import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { ITokenPayload } from '../../../auth/domain/providers/i-token-provider'
import { CurrentUser } from '../../../auth/infra/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard'
import { CreateUserDto } from '../../application/dto/create-user.dto'
import { SetSubscriptionDto } from '../../application/dto/set-subscription.dto'
import { UpdateUserDto } from '../../application/dto/update-user.dto'
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case'
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case'
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case'
import { SetSubscriptionUseCase } from '../../application/use-cases/set-subscription.use-case'
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case'

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly setSubscriptionUseCase: SetSubscriptionUseCase,
  ) {}

  // única rota pública do módulo: é o cadastro do casal
  @Post()
  create(@Body() dto: CreateUserDto): Promise<HttpResponse> {
    return this.createUserUseCase.execute(dto)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse> {
    return this.getUserUseCase.execute(user.sub, id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<HttpResponse> {
    return this.updateUserUseCase.execute(user.sub, id, dto)
  }

  // escolha do plano de assinatura da conta (mensal|anual). Sem gateway ainda.
  @Patch(':id/subscription')
  @UseGuards(JwtAuthGuard)
  setSubscription(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetSubscriptionDto,
  ): Promise<HttpResponse> {
    return this.setSubscriptionUseCase.execute(user.sub, id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse> {
    return this.deleteUserUseCase.execute(user.sub, id)
  }
}
