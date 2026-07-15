import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { UnauthorizedError } from '../../../../shared/errors'
import { ITokenPayload, ITokenProvider, TOKEN_PROVIDER } from '../../domain/providers/i-token-provider'

export interface IAuthenticatedRequest extends Request {
  user: ITokenPayload
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_PROVIDER)
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>()

    const [scheme, token] = request.headers.authorization?.split(' ') ?? []
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError()
    }

    const payload = await this.tokenProvider.verify(token)
    if (!payload) {
      throw new UnauthorizedError()
    }

    request.user = payload
    return true
  }
}
