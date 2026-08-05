import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription.use-case'
import { GetMySubscriptionUseCase } from './application/use-cases/get-my-subscription.use-case'
import { GetPlansUseCase } from './application/use-cases/get-plans.use-case'
import { HandleWebhookUseCase } from './application/use-cases/handle-webhook.use-case'
import { StartSubscriptionUseCase } from './application/use-cases/start-subscription.use-case'
import { IPaymentProvider, PAYMENT_PROVIDER } from './domain/providers/i-payment-provider'
import { SUBSCRIPTION_READ_REPOSITORY } from './domain/repositories/i-subscription-read-repository'
import { SUBSCRIPTION_REPOSITORY } from './domain/repositories/i-subscription-repository'
import { SUBSCRIPTION_WRITE_REPOSITORY } from './domain/repositories/i-subscription-write-repository'
import { BillingController } from './infra/controllers/billing.controller'
import { SubscriptionEntity } from './infra/entities/subscription.entity'
import { FakePaymentProvider } from './infra/providers/fake-payment.provider'
import { MercadoPagoProvider } from './infra/providers/mercado-pago.provider'
import { TypeormSubscriptionRepository } from './infra/repositories/typeorm-subscription.repository'

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity]),
    // JwtAuthGuard vem do AuthModule; UsersModule dá acesso ao repo de usuários
    // (email do pagador + espelho de status).
    AuthModule,
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [
    TypeormSubscriptionRepository,
    { provide: SUBSCRIPTION_REPOSITORY, useExisting: TypeormSubscriptionRepository },
    { provide: SUBSCRIPTION_READ_REPOSITORY, useExisting: TypeormSubscriptionRepository },
    { provide: SUBSCRIPTION_WRITE_REPOSITORY, useExisting: TypeormSubscriptionRepository },
    // useFactory (não useClass): useClass avaliaria o ternário na decoração deste
    // arquivo, que roda no import — antes do ConfigModule ler o .env. MP_ACCESS_TOKEN
    // ainda não estaria em process.env e cairia sempre no fake. Igual ao MailModule.
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (): IPaymentProvider =>
        process.env.MP_ACCESS_TOKEN ? new MercadoPagoProvider() : new FakePaymentProvider(),
    },
    StartSubscriptionUseCase,
    GetMySubscriptionUseCase,
    CancelSubscriptionUseCase,
    HandleWebhookUseCase,
    GetPlansUseCase,
  ],
  exports: [SUBSCRIPTION_READ_REPOSITORY],
})
export class BillingModule {}
