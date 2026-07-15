import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ITokenPayload, ITokenProvider } from '../../domain/providers/i-token-provider'

@Injectable()
export class JwtTokenProvider implements ITokenProvider {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: ITokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload)
  }

  async verify(token: string): Promise<ITokenPayload | null> {
    try {
      return await this.jwtService.verifyAsync<ITokenPayload>(token)
    } catch {
      return null
    }
  }
}
