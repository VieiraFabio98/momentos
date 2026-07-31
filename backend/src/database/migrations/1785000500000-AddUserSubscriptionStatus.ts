import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserSubscriptionStatus1785000500000 implements MigrationInterface {
  name = 'AddUserSubscriptionStatus1785000500000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // espelho do status da assinatura ativa (pending|active|paused|canceled).
    // Fonte da verdade é a tabela subscriptions; aqui é cache pro gate e o front.
    await queryRunner.query(`ALTER TABLE "users" ADD "subscription_status" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription_status"`)
  }
}
