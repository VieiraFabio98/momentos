import { SubscriptionPlan } from '../entities/i-subscription'

// Configuração de cobrança de cada plano, na forma que o Mercado Pago espera no
// preapproval (auto_recurring). Preços espelham a PlansView do front — mudar aqui
// exige mudar lá junto. `frequency`/`frequencyType` definem o ciclo de renovação.
export interface IPlanConfig {
  reason: string
  amount: number
  frequency: number
  frequencyType: 'months'
}

export const PLAN_CATALOG: Record<SubscriptionPlan, IPlanConfig> = {
  mensal: { reason: 'Momentos — Plano Mensal', amount: 49.99, frequency: 1, frequencyType: 'months' },
  anual: { reason: 'Momentos — Plano Anual', amount: 499, frequency: 12, frequencyType: 'months' },
}
