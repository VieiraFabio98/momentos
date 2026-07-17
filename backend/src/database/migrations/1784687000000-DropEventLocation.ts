import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropEventLocation1784687000000 implements MigrationInterface {
  name = 'DropEventLocation1784687000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "location"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "location" character varying NOT NULL DEFAULT ''`)
  }
}
