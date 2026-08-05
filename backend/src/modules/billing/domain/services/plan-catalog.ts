import { SubscriptionPlan } from '../entities/i-subscription'

// Configuração de cobrança de cada plano, na forma que o Mercado Pago espera no
// preapproval (auto_recurring). O ciclo (frequency) é fixo; o valor vem do .env
// para trocar preço sem deploy de código — mudar PLAN_*_AMOUNT e reiniciar basta.
export interface IPlanConfig {
  reason: string
  amount: number
  frequency: number
  frequencyType: 'months'
}

// valores padrão (em reais) caso o .env não defina — simbólicos para a fase sem
// comercialização. Em produção, sobrescrever via PLAN_MENSAL_AMOUNT / PLAN_ANUAL_AMOUNT.
const DEFAULT_MENSAL_AMOUNT = 0.1
const DEFAULT_ANUAL_AMOUNT = 0.2

function amountFromEnv(envVar: string, fallback: number): number {
  const raw = process.env[envVar]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${envVar} inválido: "${raw}" — precisa ser número positivo (reais)`)
  }
  return parsed
}

// Lido a cada request (não no import) para o .env já estar carregado pelo
// ConfigModule — mesma armadilha de timing que derrubou a escolha do provider.
export function getPlanConfig(plan: SubscriptionPlan): IPlanConfig {
  switch (plan) {
    case 'mensal':
      return {
        reason: 'Momentos — Plano Mensal',
        amount: amountFromEnv('PLAN_MENSAL_AMOUNT', DEFAULT_MENSAL_AMOUNT),
        frequency: 1,
        frequencyType: 'months',
      }
    case 'anual':
      return {
        reason: 'Momentos — Plano Anual',
        amount: amountFromEnv('PLAN_ANUAL_AMOUNT', DEFAULT_ANUAL_AMOUNT),
        frequency: 12,
        frequencyType: 'months',
      }
  }
}
