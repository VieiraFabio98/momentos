import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class ConfirmPhotoUploadDto {
  @IsString()
  @IsNotEmpty()
  storageKey: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  guestName?: string
}
