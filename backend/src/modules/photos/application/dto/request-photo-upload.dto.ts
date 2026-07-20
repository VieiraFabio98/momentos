import { IsIn, IsInt, Max, Min } from 'class-validator'

export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type PhotoContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

export const MIN_PHOTO_SIZE_BYTES = 1024
// front comprime p/ 1920px @ q0.8 (~200-600KB); 5MB dá folga sem permitir abuso
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

export class RequestPhotoUploadDto {
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: PhotoContentType

  @IsInt()
  @Min(MIN_PHOTO_SIZE_BYTES)
  @Max(MAX_PHOTO_SIZE_BYTES)
  size: number
}
