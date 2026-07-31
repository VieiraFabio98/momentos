import { Body, Controller, Delete, Get, Headers, Post, Query, UseGuards } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { ITokenPayload } from '../../../auth/domain/providers/i-token-provider'
import { CurrentUser } from '../../../auth/infra/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/infra/guards/jwt-auth.guard'
import { StartSubscriptionDto } from '../../application/dto/start-subscription.dto'
import { CancelSubscriptionUseCase } from '../../application/use-cases/cancel-subscription.use-case'
import { GetMySubscriptionUseCase } from '../../application/use-cases/get-my-subscription.use-case'
import { HandleWebhookUseCase } from '../../application/use-cases/handle-webhook.use-case'
import { StartSubscriptionUseCase } from '../../application/use-cases/start-subscription.use-case'

// Corpo de notificação do Mercado Pago: { type, data: { id } }. O MP também pode
// mandar os mesmos dados na query (?type=...&data.id=...); o webhook lê os dois.
interface IWebhookBody {
  type?: string
  action?: string
  data?: { id?: string }
}

@Controller('billing')
export class BillingController {
  constructor(
    private readonly startSubscriptionUseCase: StartSubscriptionUseCase,
    private readonly getMySubscriptionUseCase: GetMySubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly handleWebhookUseCase: HandleWebhookUseCase,
  ) {}

  // Inicia a assinatura e devolve { initPoint }; o front redireciona para lá.
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser() user: ITokenPayload,
    @Body() dto: StartSubscriptionDto,
  ): Promise<HttpResponse> {
    return this.startSubscriptionUseCase.execute(user.sub, dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: ITokenPayload): Promise<HttpResponse> {
    return this.getMySubscriptionUseCase.execute(user.sub)
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: ITokenPayload): Promise<HttpResponse> {
    return this.cancelSubscriptionUseCase.execute(user.sub)
  }

  // Rota pública: o gateway chama sem JWT. A autenticidade é garantida pela
  // validação da assinatura HMAC dentro do use-case, não por guard.
  @Post('webhook')
  webhook(
    @Body() body: IWebhookBody,
    @Query('type') queryType: string | undefined,
    @Query('data.id') queryDataId: string | undefined,
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
  ): Promise<HttpResponse> {
    return this.handleWebhookUseCase.execute({
      type: body?.type ?? queryType,
      dataId: body?.data?.id ?? queryDataId,
      signature,
      requestId,
    })
  }
}
