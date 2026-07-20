import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { buildDataSourceOptions } from './database/typeorm.config'
import { AuthModule } from './modules/auth/auth.module'
import { EventsModule } from './modules/events/events.module'
import { MailModule } from './modules/mail/mail.module'
import { PhotosModule } from './modules/photos/photos.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDataSourceOptions(),
    }),
    UsersModule,
    AuthModule,
    EventsModule,
    PhotosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
