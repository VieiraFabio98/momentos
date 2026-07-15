import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { ITokenPayload } from '../../domain/providers/i-token-provider'
import { IAuthenticatedRequest } from '../guards/jwt-auth.guard'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ITokenPayload => {
    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>()
    return request.user
  },
)
