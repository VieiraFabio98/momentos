import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { buildDataSourceOptions } from './database/typeorm.config'
import { AuthModule } from './modules/auth/auth.module'
import { EventsModule } from './modules/events/events.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDataSourceOptions(),
    }),
    UsersModule,
    AuthModule,
    EventsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
