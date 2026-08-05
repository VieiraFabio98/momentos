import { Injectable } from '@nestjs/common'
import { HttpResponse, ok } from '../../../../shared/helpers'
import { SubscriptionPlan } from '../../domain/entities/i-subscription'
import { getPlanConfig } from '../../domain/services/plan-catalog'

const PLANS: SubscriptionPlan[] = ['mensal', 'anual']

// Preço vigente de cada plano, lido do catálogo (que vem do .env). É a fonte
// única: o front consome isto em vez de fixar valores, então trocar PLAN_*_AMOUNT
// no backend muda a vitrine e a cobrança de uma vez só.
@Injectable()
export class GetPlansUseCase {
  async execute(): Promise<HttpResponse> {
    const plans = PLANS.map((plan) => {
      const config = getPlanConfig(plan)
      return {
        plan,
        amount: config.amount,
        frequency: config.frequency,
        frequencyType: config.frequencyType,
      }
    })
    return ok(plans)
  }
}
