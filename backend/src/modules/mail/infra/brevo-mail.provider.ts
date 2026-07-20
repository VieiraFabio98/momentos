import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { IMailMessage, IMailProvider } from '../domain/i-mail-provider'

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

@Injectable()
export class BrevoMailProvider implements IMailProvider, OnModuleInit {
  private readonly logger = new Logger('BrevoMailProvider')
  private apiKey: string
  private senderEmail: string
  private senderName: string

  onModuleInit(): void {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error('BREVO_API_KEY precisa estar definida no ambiente')
    }
    this.apiKey = apiKey
    this.senderEmail = process.env.MAIL_FROM_EMAIL ?? process.env.GMAIL_USER ?? ''
    this.senderName = process.env.MAIL_FROM_NAME ?? 'Momentos'

    if (!this.senderEmail) {
      throw new Error('MAIL_FROM_EMAIL (ou GMAIL_USER) precisa estar definida como remetente')
    }
  }

  async send(message: IMailMessage): Promise<void> {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Brevo respondeu ${response.status}: ${body}`)
    }

    const { messageId } = (await response.json()) as { messageId?: string }
    this.logger.log(
      `[MAIL] aceito pela Brevo para ${message.to} | subject: ${message.subject} | messageId: ${messageId ?? 'n/a'}`,
    )
  }
}
