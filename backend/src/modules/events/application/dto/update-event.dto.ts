import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string

  @IsOptional()
  @IsDateString()
  eventDate?: string

  @IsOptional()
  @IsDateString()
  opensAt?: string | null
}
