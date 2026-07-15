import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, MoreThan, Repository } from 'typeorm'
import { IPasswordResetToken } from '../../domain/entities/i-password-reset-token'
import {
  ICreatePasswordResetTokenData,
  IPasswordResetTokenRepository,
} from '../../domain/repositories/i-password-reset-token-repository'
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity'

@Injectable()
export class TypeormPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repository: Repository<PasswordResetTokenEntity>,
  ) {}

  create(data: ICreatePasswordResetTokenData): Promise<IPasswordResetToken> {
    const token = this.repository.create(data)
    return this.repository.save(token)
  }

  findValidByTokenHash(tokenHash: string): Promise<IPasswordResetToken | null> {
    return this.repository.findOneBy({
      tokenHash,
      usedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    })
  }

  async markUsed(id: string): Promise<void> {
    await this.repository.update(id, { usedAt: new Date() })
  }
}
