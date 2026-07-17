import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEventOpensAt1784292161526 implements MigrationInterface {
  name = 'AddEventOpensAt1784292161526'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "opens_at" TIMESTAMP`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "opens_at"`)
  }
}
