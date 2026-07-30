import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { HttpResponse } from '../../../../shared/helpers'
import { DownloadEventAlbumUseCase } from '../../application/use-cases/download-event-album.use-case'
import { GetPublicAlbumUseCase } from '../../application/use-cases/get-public-album.use-case'

// sem guard de propósito: o álbum curado é aberto pelo casal, que não tem conta.
// Quem protege é o albumToken, que a cerimonialista libera e pode revogar.
@Controller('album/events')
export class PublicAlbumController {
  constructor(
    private readonly getPublicAlbumUseCase: GetPublicAlbumUseCase,
    private readonly downloadEventAlbumUseCase: DownloadEventAlbumUseCase,
  ) {}

  @Get(':albumToken')
  album(@Param('albumToken') albumToken: string): Promise<HttpResponse> {
    return this.getPublicAlbumUseCase.execute(albumToken)
  }

  @Get(':albumToken/archive')
  async archive(
    @Param('albumToken') albumToken: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.downloadEventAlbumUseCase.executeByAlbumToken(albumToken)
    if (result === 'not_found') {
      throw new NotFoundException('Álbum não encontrado')
    }
    if (result === 'empty') {
      throw new BadRequestException('O álbum ainda não tem fotos')
    }

    response.setHeader('Content-Type', 'application/zip')
    response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    result.archive.pipe(response)
  }
}
