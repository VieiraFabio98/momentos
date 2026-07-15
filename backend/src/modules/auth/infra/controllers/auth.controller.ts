import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { HttpResponse } from '../../../../shared/helpers'
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto'
import { GoogleLoginDto } from '../../application/dto/google-login.dto'
import { LoginDto } from '../../application/dto/login.dto'
import { ResetPasswordDto } from '../../application/dto/reset-password.dto'
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case'
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case'
import { GoogleLoginUseCase } from '../../application/use-cases/google-login.use-case'
import { LoginUseCase } from '../../application/use-cases/login.use-case'
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case'
import { ITokenPayload } from '../../domain/providers/i-token-provider'
import { CurrentUser } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto): Promise<HttpResponse> {
    return this.loginUseCase.execute(dto)
  }

  @Post('google')
  googleLogin(@Body() dto: GoogleLoginDto): Promise<HttpResponse> {
    return this.googleLoginUseCase.execute(dto)
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<HttpResponse> {
    return this.forgotPasswordUseCase.execute(dto)
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<HttpResponse> {
    return this.resetPasswordUseCase.execute(dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: ITokenPayload): Promise<HttpResponse> {
    return this.getMeUseCase.execute(user.sub)
  }
}
