import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEventAlbumToken1785000000000 implements MigrationInterface {
  name = 'AddEventAlbumToken1785000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ambos nullable de propósito: o álbum do casal só existe depois que a
    // cerimonialista clica "liberar". Evento nunca liberado fica com os dois
    // NULL — nada retroativo, os eventos que já existem seguem sem link público.
    await queryRunner.query(`ALTER TABLE "events" ADD "album_token" character varying`)
    await queryRunner.query(`ALTER TABLE "events" ADD "album_released_at" TIMESTAMP`)

    // NULLs não colidem em índice único no Postgres, então vários eventos
    // "não liberados" convivem; quando liberados, o token é único.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_events_album_token" ON "events" ("album_token")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_events_album_token"`)
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "album_released_at"`)
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "album_token"`)
  }
}
