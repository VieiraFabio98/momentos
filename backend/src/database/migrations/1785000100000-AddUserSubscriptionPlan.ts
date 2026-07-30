import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserSubscriptionPlan1785000100000 implements MigrationInterface {
  name = 'AddUserSubscriptionPlan1785000100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // nullable: conta sem assinatura fica NULL. Sem gateway ainda, então é só a
    // escolha do plano (mensal|anual) — nenhuma cobrança está atrelada a ele.
    await queryRunner.query(`ALTER TABLE "users" ADD "subscription_plan" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription_plan"`)
  }
}
