import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator'
import { EventPlan } from '../../domain/entities/i-event'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsDateString()
  eventDate: string

  @IsString()
  @IsNotEmpty()
  location: string

  @IsIn(['degustacao', 'momento', 'memoria'])
  plan: EventPlan
}
