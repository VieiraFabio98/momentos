import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { EventPlan } from '../../domain/entities/i-event'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsDateString()
  eventDate: string

  @IsIn(['degustacao', 'momento', 'memoria'])
  plan: EventPlan

  @IsOptional()
  @IsDateString()
  opensAt?: string

  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
