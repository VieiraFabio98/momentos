import { Controller, Get, Param } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { GetEventByPublicTokenUseCase } from '../../application/use-cases/get-event-by-public-token.use-case'

@Controller('guest/events')
export class GuestEventsController {
  constructor(private readonly getEventByPublicTokenUseCase: GetEventByPublicTokenUseCase) {}

  @Get(':token')
  findByToken(@Param('token') token: string): Promise<HttpResponse> {
    return this.getEventByPublicTokenUseCase.execute(token)
  }
}
