import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEventDisplayToken1784950000000 implements MigrationInterface {
  name = 'AddEventDisplayToken1784950000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "display_token" character varying`)

    // eventos que já existem precisam de um token antes da coluna virar NOT NULL.
    // uuid_generate_v4 (uuid-ossp, já usada nas outras migrations) duas vezes dá
    // 64 caracteres hex, mesmo comprimento dos tokens gerados pela aplicação
    await queryRunner.query(`
      UPDATE "events"
         SET "display_token" = replace(uuid_generate_v4()::text, '-', '')
       WHERE "display_token" IS NULL
    `)

    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "display_token" SET NOT NULL`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_events_display_token" ON "events" ("display_token")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_events_display_token"`)
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "display_token"`)
  }
}
