import { Module } from '@nestjs/common'
import { JwtModule, JwtSignOptions } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from '../users/users.module'
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case'
import { GetMeUseCase } from './application/use-cases/get-me.use-case'
import { GoogleLoginUseCase } from './application/use-cases/google-login.use-case'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case'
import { MAIL_PROVIDER } from './domain/providers/i-mail-provider'
import { OAUTH_PROVIDER } from './domain/providers/i-oauth-provider'
import { TOKEN_PROVIDER } from './domain/providers/i-token-provider'
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/i-password-reset-token-repository'
import { AuthController } from './infra/controllers/auth.controller'
import { PasswordResetTokenEntity } from './infra/entities/password-reset-token.entity'
import { JwtAuthGuard } from './infra/guards/jwt-auth.guard'
import { ConsoleMailProvider } from './infra/providers/console-mail.provider'
import { GoogleOAuthProvider } from './infra/providers/google-oauth.provider'
import { JwtTokenProvider } from './infra/providers/jwt-token.provider'
import { TypeormPasswordResetTokenRepository } from './infra/repositories/typeorm-password-reset-token.repository'

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([PasswordResetTokenEntity]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET
        if (!secret) {
          throw new Error('JWT_SECRET não definido no ambiente')
        }
        return {
          secret,
          signOptions: {
            expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as JwtSignOptions['expiresIn'],
          },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: TOKEN_PROVIDER, useClass: JwtTokenProvider },
    { provide: MAIL_PROVIDER, useClass: ConsoleMailProvider },
    { provide: OAUTH_PROVIDER, useClass: GoogleOAuthProvider },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: TypeormPasswordResetTokenRepository,
    },
    JwtAuthGuard,
    LoginUseCase,
    GetMeUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GoogleLoginUseCase,
  ],
  exports: [TOKEN_PROVIDER, JwtAuthGuard],
})
export class AuthModule {}
