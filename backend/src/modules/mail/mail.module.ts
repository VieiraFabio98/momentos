import { Global, Module } from '@nestjs/common'
import { MAIL_PROVIDER } from './domain/i-mail-provider'
import { BrevoMailProvider } from './infra/brevo-mail.provider'
import { ConsoleMailProvider } from './infra/console-mail.provider'

@Global()
@Module({
  providers: [
    {
      provide: MAIL_PROVIDER,
      useClass: process.env.BREVO_API_KEY ? BrevoMailProvider : ConsoleMailProvider,
    },
  ],
  exports: [MAIL_PROVIDER],
})
export class MailModule {}
