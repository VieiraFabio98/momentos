import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator'
import { EventPlan } from '../../domain/entities/i-event'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsDateString()
  eventDate: string

  @IsIn(['degustacao', 'momento', 'memoria'])
  plan: EventPlan

  // data e hora em que o evento começa; os envios abrem aqui e ficam 24h abertos
  @IsDateString()
  opensAt: string
}
