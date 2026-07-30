import { IsIn } from 'class-validator'
import { SubscriptionPlan } from '../../domain/entities/i-user'

export class SetSubscriptionDto {
  @IsIn(['mensal', 'anual'])
  plan: SubscriptionPlan
}
