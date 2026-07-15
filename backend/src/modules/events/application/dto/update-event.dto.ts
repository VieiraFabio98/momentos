import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { EventPlan } from '../../domain/entities/i-event'

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string

  @IsOptional()
  @IsDateString()
  eventDate?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string

  @IsOptional()
  @IsIn(['degustacao', 'momento', 'memoria'])
  plan?: EventPlan
}
