import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventsModule } from '../events/events.module'
import { ConfirmPhotoUploadUseCase } from './application/use-cases/confirm-photo-upload.use-case'
import { RequestPhotoUploadUseCase } from './application/use-cases/request-photo-upload.use-case'
import { STORAGE_PROVIDER } from './domain/providers/i-storage-provider'
import { PHOTO_READ_REPOSITORY } from './domain/repositories/i-photo-read-repository'
import { PHOTO_REPOSITORY } from './domain/repositories/i-photo-repository'
import { PHOTO_WRITE_REPOSITORY } from './domain/repositories/i-photo-write-repository'
import { GuestPhotosController } from './infra/controllers/guest-photos.controller'
import { PhotoEntity } from './infra/entities/photo.entity'
import { S3StorageProvider } from './infra/providers/s3-storage.provider'
import { TypeormPhotoRepository } from './infra/repositories/typeorm-photo.repository'

@Module({
  imports: [TypeOrmModule.forFeature([PhotoEntity]), EventsModule],
  controllers: [GuestPhotosController],
  providers: [
    TypeormPhotoRepository,
    { provide: PHOTO_REPOSITORY, useExisting: TypeormPhotoRepository },
    { provide: PHOTO_READ_REPOSITORY, useExisting: TypeormPhotoRepository },
    { provide: PHOTO_WRITE_REPOSITORY, useExisting: TypeormPhotoRepository },
    { provide: STORAGE_PROVIDER, useClass: S3StorageProvider },
    RequestPhotoUploadUseCase,
    ConfirmPhotoUploadUseCase,
  ],
  exports: [PHOTO_REPOSITORY, PHOTO_READ_REPOSITORY, PHOTO_WRITE_REPOSITORY, STORAGE_PROVIDER],
})
export class PhotosModule {}
