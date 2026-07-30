import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropEventPlan1785000200000 implements MigrationInterface {
  name = 'DropEventPlan1785000200000'

  // o plano deixou de morar no evento: virou assinatura da conta (mensal|anual).
  // Degustação/momento/memória e o limite por evento saíram junto.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "plan"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD "plan" character varying NOT NULL DEFAULT 'momento'`,
    )
  }
}
