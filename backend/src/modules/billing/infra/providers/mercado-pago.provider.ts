import { Injectable, Logger } from '@nestjs/common'
import { MercadoPagoConfig, PreApproval, WebhookSignatureValidator } from 'mercadopago'
import { SubscriptionStatus } from '../../domain/entities/i-subscription'
import {
  ICreatePreapprovalInput,
  ICreatePreapprovalResult,
  IPaymentProvider,
  IPreapprovalDetails,
} from '../../domain/providers/i-payment-provider'
import { getPlanConfig } from '../../domain/services/plan-catalog'

// Traduz o status do preapproval do Mercado Pago para o nosso vocabulário. O MP
// usa 'authorized' para assinatura pagando em dia; qualquer status desconhecido
// cai em 'paused' (conservador: sem certeza de pagamento, o gate não libera).
function mapStatus(mpStatus: string | undefined): SubscriptionStatus {
  switch (mpStatus) {
    case 'authorized':
      return 'active'
    case 'pending':
      return 'pending'
    case 'cancelled':
      return 'canceled'
    default:
      return 'paused'
  }
}

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
  private readonly logger = new Logger('MercadoPagoProvider')
  private readonly preapproval: PreApproval
  private readonly backUrl: string
  private readonly webhookSecret: string | undefined

  constructor() {
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      // O module só instancia este provider quando o token existe; se cair aqui é
      // erro de wiring, não estado normal de dev.
      throw new Error('MP_ACCESS_TOKEN ausente — MercadoPagoProvider não pode iniciar')
    }
    const client = new MercadoPagoConfig({ accessToken })
    this.preapproval = new PreApproval(client)
    this.backUrl = process.env.MP_BACK_URL ?? 'http://localhost:5173/assinatura/retorno'
    this.webhookSecret = process.env.MP_WEBHOOK_SECRET
  }

  async createPreapproval(input: ICreatePreapprovalInput): Promise<ICreatePreapprovalResult> {
    const config = getPlanConfig(input.plan)

    const response = await this.preapproval.create({
      body: {
        reason: config.reason,
        external_reference: input.externalReference,
        payer_email: input.payerEmail,
        back_url: this.backUrl,
        status: 'pending',
        auto_recurring: {
          frequency: config.frequency,
          frequency_type: config.frequencyType,
          transaction_amount: config.amount,
          currency_id: 'BRL',
        },
      },
    })

    if (!response.id || !response.init_point) {
      throw new Error('Mercado Pago não retornou id/init_point do preapproval')
    }

    return { providerSubscriptionId: response.id, initPoint: response.init_point }
  }

  async getPreapproval(providerSubscriptionId: string): Promise<IPreapprovalDetails | null> {
    try {
      const response = await this.preapproval.get({ id: providerSubscriptionId })
      return {
        providerSubscriptionId,
        status: mapStatus(response.status),
        externalReference: response.external_reference ?? null,
        currentPeriodEnd: response.next_payment_date
          ? new Date(response.next_payment_date)
          : null,
      }
    } catch (error) {
      this.logger.error(`Falha ao buscar preapproval ${providerSubscriptionId}`, error as Error)
      return null
    }
  }

  async cancel(providerSubscriptionId: string): Promise<void> {
    await this.preapproval.update({
      id: providerSubscriptionId,
      body: { status: 'cancelled' },
    })
  }

  // Valida a assinatura HMAC do webhook (x-signature). Sem MP_WEBHOOK_SECRET
  // configurado (dev/sandbox local), pula a checagem e aceita — em produção o
  // secret deve estar setado. Retorna false quando a validação falha.
  verifyNotification(input: {
    signature: string | undefined
    requestId: string | undefined
    dataId: string | undefined
  }): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('MP_WEBHOOK_SECRET ausente — pulando validação de assinatura do webhook')
      return true
    }
    try {
      WebhookSignatureValidator.validate({
        xSignature: input.signature,
        xRequestId: input.requestId,
        dataId: input.dataId,
        secret: this.webhookSecret,
        toleranceSeconds: 300,
      })
      return true
    } catch (error) {
      this.logger.warn(`Assinatura de webhook inválida: ${(error as Error).message}`)
      return false
    }
  }
}
