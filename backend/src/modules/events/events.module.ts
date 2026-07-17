import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { PhotosModule } from '../photos/photos.module'
import { CreateEventUseCase } from './application/use-cases/create-event.use-case'
import { DeleteEventUseCase } from './application/use-cases/delete-event.use-case'
import { GetEventByPublicTokenUseCase } from './application/use-cases/get-event-by-public-token.use-case'
import { GetEventQrCodeUseCase } from './application/use-cases/get-event-qrcode.use-case'
import { GetEventUseCase } from './application/use-cases/get-event.use-case'
import { ListMyEventsUseCase } from './application/use-cases/list-my-events.use-case'
import { UpdateEventUseCase } from './application/use-cases/update-event.use-case'
import { EVENT_READ_REPOSITORY } from './domain/repositories/i-event-read-repository'
import { EVENT_REPOSITORY } from './domain/repositories/i-event-repository'
import { EVENT_WRITE_REPOSITORY } from './domain/repositories/i-event-write-repository'
import { QRCODE_PROVIDER } from './domain/providers/i-qrcode-provider'
import { EventsController } from './infra/controllers/events.controller'
import { GuestEventsController } from './infra/controllers/guest-events.controller'
import { EventEntity } from './infra/entities/event.entity'
import { QrcodeLibProvider } from './infra/providers/qrcode.provider'
import { TypeormEventRepository } from './infra/repositories/typeorm-event.repository'

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity]), AuthModule, forwardRef(() => PhotosModule)],
  controllers: [EventsController, GuestEventsController],
  providers: [
    TypeormEventRepository,
    { provide: EVENT_REPOSITORY, useExisting: TypeormEventRepository },
    { provide: EVENT_READ_REPOSITORY, useExisting: TypeormEventRepository },
    { provide: EVENT_WRITE_REPOSITORY, useExisting: TypeormEventRepository },
    { provide: QRCODE_PROVIDER, useClass: QrcodeLibProvider },
    CreateEventUseCase,
    ListMyEventsUseCase,
    GetEventUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    GetEventQrCodeUseCase,
    GetEventByPublicTokenUseCase,
  ],
  exports: [EVENT_REPOSITORY, EVENT_READ_REPOSITORY, EVENT_WRITE_REPOSITORY],
})
export class EventsModule {}
