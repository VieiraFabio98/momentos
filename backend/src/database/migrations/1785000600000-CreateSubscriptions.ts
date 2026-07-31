import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateSubscriptions1785000600000 implements MigrationInterface {
  name = 'CreateSubscriptions1785000600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "plan" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "provider_subscription_id" character varying NOT NULL, "current_period_end" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_subscriptions_provider_id" ON "subscriptions" ("provider_subscription_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user_id"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_user_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_provider_id"`)
    await queryRunner.query(`DROP TABLE "subscriptions"`)
  }
}
