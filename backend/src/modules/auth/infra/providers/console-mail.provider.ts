import { Injectable, Logger } from '@nestjs/common'
import { IMailMessage, IMailProvider } from '../../domain/providers/i-mail-provider'

@Injectable()
export class ConsoleMailProvider implements IMailProvider {
  private readonly logger = new Logger('ConsoleMailProvider')

  async send(message: IMailMessage): Promise<void> {
    this.logger.log(`[MAIL] to: ${message.to} | subject: ${message.subject}`)
    this.logger.log(`[MAIL] body:\n${message.html}`)
  }
}
