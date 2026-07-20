import { Equals, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { CURRENT_CONSENT_VERSION } from '../../domain/services/consent'

export class ConfirmPhotoUploadDto {
  @IsString()
  @IsNotEmpty()
  storageKey: string

  // sem o aceite da versão vigente do termo a foto não é registrada
  @Equals(CURRENT_CONSENT_VERSION)
  consentVersion: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  guestName?: string
}
