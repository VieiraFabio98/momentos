import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateEvents1784133858088 implements MigrationInterface {
  name = 'CreateEvents1784133858088'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying NOT NULL, "event_date" date NOT NULL, "location" character varying NOT NULL, "public_token" character varying NOT NULL, "plan" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d8aa9b53338f0685f6243cf559" ON "events" ("public_token") `,
    )
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_09f256fb7f9a05f0ed9927f406b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_09f256fb7f9a05f0ed9927f406b"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_d8aa9b53338f0685f6243cf559"`)
    await queryRunner.query(`DROP TABLE "events"`)
  }
}
