import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'express'
import { HttpResponse } from '../../../../shared/helpers'
import { CurrentUser } from '../../../auth/infra/decorators/current-user.decorator'
import { ITokenPayload } from '../../../auth/domain/providers/i-token-provider'
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard'
import { DownloadEventAlbumUseCase } from '../../application/use-cases/download-event-album.use-case'
import { ListEventPhotosUseCase } from '../../application/use-cases/list-event-photos.use-case'

@Controller('events/:id/photos')
@UseGuards(JwtAuthGuard)
export class EventPhotosController {
  constructor(
    private readonly listEventPhotosUseCase: ListEventPhotosUseCase,
    private readonly downloadEventAlbumUseCase: DownloadEventAlbumUseCase,
  ) {}

  @Get()
  list(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<HttpResponse> {
    return this.listEventPhotosUseCase.execute(user.sub, eventId)
  }

  @Get('archive')
  async archive(
    @CurrentUser() user: ITokenPayload,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.downloadEventAlbumUseCase.execute(user.sub, eventId)
    if (result === 'not_found') {
      throw new NotFoundException('Evento não encontrado')
    }
    if (result === 'empty') {
      throw new BadRequestException('O álbum ainda não tem fotos')
    }

    response.setHeader('Content-Type', 'application/zip')
    response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    result.archive.pipe(response)
  }
}
