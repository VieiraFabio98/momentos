import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserPasswordNullable1784032377698 implements MigrationInterface {
  name = 'UserPasswordNullable1784032377698'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`)
  }
}
