import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AppErrorFilter } from './shared/filters/app-error.filter'
import { HttpResponseInterceptor } from './shared/interceptors/http-response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
  })
  app.useGlobalFilters(new AppErrorFilter())
  app.useGlobalInterceptors(new HttpResponseInterceptor())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const port = process.env.PORT ?? 3333
  await app.listen(port)
  console.log(`API rodando em http://localhost:${port}`)
}

bootstrap()
