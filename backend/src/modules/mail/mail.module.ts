import { Global, Module } from '@nestjs/common'
import { MAIL_PROVIDER } from './domain/i-mail-provider'
import { ConsoleMailProvider } from './infra/console-mail.provider'
import { GmailMailProvider } from './infra/gmail-mail.provider'

@Global()
@Module({
  providers: [
    {
      provide: MAIL_PROVIDER,
      useClass: process.env.GMAIL_USER ? GmailMailProvider : ConsoleMailProvider,
    },
  ],
  exports: [MAIL_PROVIDER],
})
export class MailModule {}
