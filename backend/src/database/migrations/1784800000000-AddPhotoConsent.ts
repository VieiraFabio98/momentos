import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPhotoConsent1784800000000 implements MigrationInterface {
  name = 'AddPhotoConsent1784800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // fotos já existentes ficam com a versão "0" — anteriores ao termo,
    // marcadas como sem aceite registrado em vez de fingir consentimento
    await queryRunner.query(
      `ALTER TABLE "photos" ADD "consent_version" character varying(20) NOT NULL DEFAULT '0'`,
    )
    await queryRunner.query(
      `ALTER TABLE "photos" ADD "consented_at" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "consent_version" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "consented_at" DROP DEFAULT`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "consented_at"`)
    await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "consent_version"`)
  }
}
