import { Global, Module } from '@nestjs/common'
import { IMailProvider, MAIL_PROVIDER } from './domain/i-mail-provider'
import { BrevoMailProvider } from './infra/brevo-mail.provider'
import { ConsoleMailProvider } from './infra/console-mail.provider'

@Global()
@Module({
  providers: [
    {
      provide: MAIL_PROVIDER,
      // useFactory (não useClass) de propósito: `useClass` seria resolvido na
      // decoração deste arquivo, que roda no import — antes do ConfigModule ler
      // o .env. A chave da Brevo ainda não estaria em process.env e o app cairia
      // calado no console, sem enviar e-mail nenhum.
      useFactory: (): IMailProvider =>
        process.env.BREVO_API_KEY ? new BrevoMailProvider() : new ConsoleMailProvider(),
    },
  ],
  exports: [MAIL_PROVIDER],
})
export class MailModule {}
