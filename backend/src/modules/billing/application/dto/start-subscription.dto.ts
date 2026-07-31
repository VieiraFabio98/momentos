import { IsIn } from 'class-validator'
import { SubscriptionPlan } from '../../domain/entities/i-subscription'

export class StartSubscriptionDto {
  @IsIn(['mensal', 'anual'])
  plan: SubscriptionPlan
}
