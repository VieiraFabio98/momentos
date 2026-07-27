import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { PurgeExpiredPhotosUseCase } from '../../application/use-cases/purge-expired-photos.use-case'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

@Injectable()
export class PhotoRetentionJob implements OnApplicationBootstrap {
  private readonly logger = new Logger('PhotoRetentionJob')
  private running = false

  constructor(private readonly purgeExpiredPhotos: PurgeExpiredPhotosUseCase) {}

  // Intervalo, e não @Cron em horário fixo, por causa do free tier do Render: o
  // serviço dorme após 15 min sem tráfego, e um agendamento das 3h da manhã
  // simplesmente não dispararia. Com varredura no boot + a cada 6h, qualquer
  // acordar do serviço já cobre o atraso.
  onApplicationBootstrap(): void {
    void this.run()
  }

  @Interval(SIX_HOURS_MS)
  handleInterval(): void {
    void this.run()
  }

  private async run(): Promise<void> {
    // uma rodada lenta não pode se sobrepor à seguinte
    if (this.running) {
      this.logger.warn('Varredura anterior ainda em andamento; pulando esta rodada')
      return
    }

    this.running = true
    try {
      await this.purgeExpiredPhotos.execute()
    } catch (error) {
      // erro aqui é do lote inteiro (banco fora do ar, por exemplo); a próxima
      // rodada tenta de novo, e nada foi marcado como apagado nesse meio-tempo
      this.logger.error(`Varredura de retenção falhou: ${(error as Error).message}`)
    } finally {
      this.running = false
    }
  }
}
