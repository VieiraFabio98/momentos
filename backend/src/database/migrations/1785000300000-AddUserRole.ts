import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserRole1785000300000 implements MigrationInterface {
  name = 'AddUserRole1785000300000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // role da conta: 'user' (cerimonialista comum) ou 'admin' (conta interna que
    // cria eventos sem assinatura ativa). NOT NULL com default 'user' — contas
    // existentes viram 'user'.
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'user'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`)
  }
}
