import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { EventsModule } from '../events/events.module'
import { ConfirmPhotoUploadUseCase } from './application/use-cases/confirm-photo-upload.use-case'
import { DeletePhotoUseCase } from './application/use-cases/delete-photo.use-case'
import { DownloadEventAlbumUseCase } from './application/use-cases/download-event-album.use-case'
import { GetPublicAlbumUseCase } from './application/use-cases/get-public-album.use-case'
import { ListEventPhotosUseCase } from './application/use-cases/list-event-photos.use-case'
import { PurgeExpiredPhotosUseCase } from './application/use-cases/purge-expired-photos.use-case'
import { PurgeUserPhotosUseCase } from './application/use-cases/purge-user-photos.use-case'
import { RequestPhotoUploadUseCase } from './application/use-cases/request-photo-upload.use-case'
import { PhotoRetentionJob } from './infra/jobs/photo-retention.job'
import { STORAGE_PROVIDER } from './domain/providers/i-storage-provider'
import { PHOTO_READ_REPOSITORY } from './domain/repositories/i-photo-read-repository'
import { PHOTO_REPOSITORY } from './domain/repositories/i-photo-repository'
import { PHOTO_WRITE_REPOSITORY } from './domain/repositories/i-photo-write-repository'
import { EventPhotosController } from './infra/controllers/event-photos.controller'
import { GuestPhotosController } from './infra/controllers/guest-photos.controller'
import { PublicAlbumController } from './infra/controllers/public-album.controller'
import { PhotoEntity } from './infra/entities/photo.entity'
import { S3StorageProvider } from './infra/providers/s3-storage.provider'
import { TypeormPhotoRepository } from './infra/repositories/typeorm-photo.repository'

@Module({
  imports: [
    TypeOrmModule.forFeature([PhotoEntity]),
    forwardRef(() => EventsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [GuestPhotosController, EventPhotosController, PublicAlbumController],
  providers: [
    TypeormPhotoRepository,
    { provide: PHOTO_REPOSITORY, useExisting: TypeormPhotoRepository },
    { provide: PHOTO_READ_REPOSITORY, useExisting: TypeormPhotoRepository },
    { provide: PHOTO_WRITE_REPOSITORY, useExisting: TypeormPhotoRepository },
    { provide: STORAGE_PROVIDER, useClass: S3StorageProvider },
    RequestPhotoUploadUseCase,
    ConfirmPhotoUploadUseCase,
    ListEventPhotosUseCase,
    DownloadEventAlbumUseCase,
    GetPublicAlbumUseCase,
    DeletePhotoUseCase,
    PurgeExpiredPhotosUseCase,
    PurgeUserPhotosUseCase,
    PhotoRetentionJob,
  ],
  exports: [
    PHOTO_REPOSITORY,
    PHOTO_READ_REPOSITORY,
    PHOTO_WRITE_REPOSITORY,
    STORAGE_PROVIDER,
    PurgeUserPhotosUseCase,
  ],
})
export class PhotosModule {}
