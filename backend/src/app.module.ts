import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { buildDataSourceOptions } from './database/typeorm.config'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { EventsModule } from './modules/events/events.module'
import { MailModule } from './modules/mail/mail.module'
import { PhotosModule } from './modules/photos/photos.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MailModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDataSourceOptions(),
    }),
    UsersModule,
    AuthModule,
    EventsModule,
    PhotosModule,
    BillingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
