import { Body, Controller, Param, Post } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { ConfirmPhotoUploadDto } from '../../application/dto/confirm-photo-upload.dto'
import { RequestPhotoUploadDto } from '../../application/dto/request-photo-upload.dto'
import { ConfirmPhotoUploadUseCase } from '../../application/use-cases/confirm-photo-upload.use-case'
import { RequestPhotoUploadUseCase } from '../../application/use-cases/request-photo-upload.use-case'

@Controller('guest/events/:token/photos')
export class GuestPhotosController {
  constructor(
    private readonly requestPhotoUploadUseCase: RequestPhotoUploadUseCase,
    private readonly confirmPhotoUploadUseCase: ConfirmPhotoUploadUseCase,
  ) {}

  @Post('presign')
  presign(
    @Param('token') token: string,
    @Body() dto: RequestPhotoUploadDto,
  ): Promise<HttpResponse> {
    return this.requestPhotoUploadUseCase.execute(token, dto)
  }

  @Post()
  confirm(
    @Param('token') token: string,
    @Body() dto: ConfirmPhotoUploadDto,
  ): Promise<HttpResponse> {
    return this.confirmPhotoUploadUseCase.execute(token, dto)
  }
}
