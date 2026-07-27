import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEventPhotosPurgedAt1784900000000 implements MigrationInterface {
  name = 'AddEventPhotosPurgedAt1784900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "photos_purged_at" TIMESTAMP`)
    // o job varre por esta coluna; sem índice ele faria seq scan a cada rodada
    await queryRunner.query(
      `CREATE INDEX "IDX_events_photos_purged_at" ON "events" ("photos_purged_at")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_events_photos_purged_at"`)
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "photos_purged_at"`)
  }
}
