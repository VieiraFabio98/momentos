import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { CurrentUser } from '../../../auth/infra/decorators/current-user.decorator'
import { ITokenPayload } from '../../../auth/domain/providers/i-token-provider'
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard'
import { ListEventPhotosUseCase } from '../../application/use-cases/list-event-photos.use-case'

@Controller('events/:id/photos')
@UseGuards(JwtAuthGuard)
export class EventPhotosController {
  constructor(private readonly listEventPhotosUseCase: ListEventPhotosUseCase) {}

  @Get()
  list(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<HttpResponse> {
    return this.listEventPhotosUseCase.execute(user.sub, eventId)
  }
}
