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
import { CurrentUser } from '../../../auth/infra/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard'
import { ITokenPayload } from '../../../auth/domain/providers/i-token-provider'
import { CreateEventDto } from '../../application/dto/create-event.dto'
import { UpdateEventDto } from '../../application/dto/update-event.dto'
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case'
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case'
import { GetEventQrCodeUseCase } from '../../application/use-cases/get-event-qrcode.use-case'
import { GetEventUseCase } from '../../application/use-cases/get-event.use-case'
import { ListMyEventsUseCase } from '../../application/use-cases/list-my-events.use-case'
import { UpdateEventUseCase } from '../../application/use-cases/update-event.use-case'

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly listMyEventsUseCase: ListMyEventsUseCase,
    private readonly getEventUseCase: GetEventUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly getEventQrCodeUseCase: GetEventQrCodeUseCase,
  ) {}

  @Get(':id/qrcode')
  qrCode(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse> {
    return this.getEventQrCodeUseCase.execute(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: ITokenPayload, @Body() dto: CreateEventDto): Promise<HttpResponse> {
    return this.createEventUseCase.execute(user.sub, dto)
  }

  @Get()
  findMine(@CurrentUser() user: ITokenPayload): Promise<HttpResponse> {
    return this.listMyEventsUseCase.execute(user.sub)
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse> {
    return this.getEventUseCase.execute(user.sub, id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<HttpResponse> {
    return this.updateEventUseCase.execute(user.sub, id, dto)
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse> {
    return this.deleteEventUseCase.execute(user.sub, id)
  }
}
