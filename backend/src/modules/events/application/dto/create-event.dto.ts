import { IsDateString, IsNotEmpty, IsString } from 'class-validator'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsDateString()
  eventDate: string

  // data e hora em que o evento começa; os envios abrem aqui e ficam 24h abertos
  @IsDateString()
  opensAt: string
}
