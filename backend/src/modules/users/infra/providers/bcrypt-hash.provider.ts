import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { IHashProvider } from '../../domain/providers/i-hash-provider'

@Injectable()
export class BcryptHashProvider implements IHashProvider {
  private readonly saltRounds = 10

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds)
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed)
  }
}
