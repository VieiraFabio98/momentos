import { IPasswordResetToken } from '../entities/i-password-reset-token'

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY')

export interface ICreatePasswordResetTokenData {
  userId: string
  tokenHash: string
  expiresAt: Date
}

export interface IPasswordResetTokenRepository {
  create(data: ICreatePasswordResetTokenData): Promise<IPasswordResetToken>
  findValidByTokenHash(tokenHash: string): Promise<IPasswordResetToken | null>
  markUsed(id: string): Promise<void>
}
