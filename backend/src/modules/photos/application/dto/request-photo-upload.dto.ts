import { IsIn } from 'class-validator'

export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type PhotoContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

export class RequestPhotoUploadDto {
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: PhotoContentType
}
