import { Controller, Get, Param, Query } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { GetDisplayFeedUseCase } from '../../application/use-cases/get-display-feed.use-case'

// sem guard de propósito: o telão é aberto no aparelho ligado ao projetor, que
// não tem sessão. Quem protege é o displayToken, que o casal pode trocar.
@Controller('display/events')
export class DisplayController {
  constructor(private readonly getDisplayFeedUseCase: GetDisplayFeedUseCase) {}

  @Get(':displayToken')
  feed(
    @Param('displayToken') displayToken: string,
    @Query('since') since?: string,
  ): Promise<HttpResponse> {
    return this.getDisplayFeedUseCase.execute(displayToken, since)
  }
}
