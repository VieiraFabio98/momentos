import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePhotos1784143542389 implements MigrationInterface {
  name = 'CreatePhotos1784143542389'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "storage_key" character varying NOT NULL, "guest_name" character varying, "approved" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_80f247464fa113f7a81928d07b6" UNIQUE ("storage_key"), CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_8089e0d1ec8c17d988882474cc" ON "photos" ("event_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "photos" ADD CONSTRAINT "FK_8089e0d1ec8c17d988882474cc7" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_8089e0d1ec8c17d988882474cc7"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_8089e0d1ec8c17d988882474cc"`)
    await queryRunner.query(`DROP TABLE "photos"`)
  }
}
