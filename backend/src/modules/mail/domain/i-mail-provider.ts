export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER')

export interface IMailMessage {
  to: string
  subject: string
  html: string
}

export interface IMailProvider {
  send(message: IMailMessage): Promise<void>
}
