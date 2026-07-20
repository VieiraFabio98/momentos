import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { createTransport, Transporter } from 'nodemailer'
import { IMailMessage, IMailProvider } from '../domain/i-mail-provider'

@Injectable()
export class GmailMailProvider implements IMailProvider, OnModuleInit {
  private readonly logger = new Logger('GmailMailProvider')
  private transporter: Transporter

  onModuleInit(): void {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')

    if (!user || !pass) {
      throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD precisam estar definidos no ambiente')
    }

    this.transporter = createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }

  async send(message: IMailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: `Momentos <${process.env.GMAIL_USER}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
    })
    this.logger.log(`[MAIL] enviado para ${message.to} | subject: ${message.subject}`)
  }
}
