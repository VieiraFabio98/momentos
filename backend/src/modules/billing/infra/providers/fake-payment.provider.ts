import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  ICreatePreapprovalInput,
  ICreatePreapprovalResult,
  IPaymentProvider,
  IPreapprovalDetails,
} from '../../domain/providers/i-payment-provider'

// Fallback de desenvolvimento quando MP_ACCESS_TOKEN não está setado — mesma
// ideia do ConsoleMailProvider. Não fala com o Mercado Pago: gera um id fake e
// aponta o checkout de volta para a tela de retorno já como sucesso, para o
// fluxo do front poder ser exercitado sem credenciais. Nunca usar em produção.
@Injectable()
export class FakePaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger('FakePaymentProvider')
  private readonly backUrl = process.env.MP_BACK_URL ?? 'http://localhost:5173/assinatura/retorno'

  async createPreapproval(input: ICreatePreapprovalInput): Promise<ICreatePreapprovalResult> {
    const providerSubscriptionId = `fake-${randomUUID()}`
    this.logger.warn(
      `Preapproval FAKE criado para ${input.payerEmail} (plano ${input.plan}) — sem cobrança real`,
    )
    return {
      providerSubscriptionId,
      initPoint: `${this.backUrl}?preapproval_id=${providerSubscriptionId}&status=authorized`,
    }
  }

  async getPreapproval(providerSubscriptionId: string): Promise<IPreapprovalDetails | null> {
    // sem gateway real: assume aprovado, período de 30 dias
    return {
      providerSubscriptionId,
      status: 'active',
      externalReference: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  }

  async cancel(providerSubscriptionId: string): Promise<void> {
    this.logger.warn(`Cancelamento FAKE de ${providerSubscriptionId}`)
  }

  verifyNotification(): boolean {
    return true
  }
}
