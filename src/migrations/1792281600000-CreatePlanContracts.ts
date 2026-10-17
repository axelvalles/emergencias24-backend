import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanContracts1792281600000 implements MigrationInterface {
  name = 'CreatePlanContracts1792281600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."plan_subscriptions_payertype_enum" ADD VALUE IF NOT EXISTS 'INDIVIDUAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "beneficiaryCapacity" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD CONSTRAINT "CHK_PLANS_BENEFICIARY_CAPACITY" CHECK ("beneficiaryCapacity" IS NULL OR "beneficiaryCapacity" > 0)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_contracts_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'CANCELED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_contracts" ("id" uuid NOT NULL, "fixedPrice" numeric(10,2) NOT NULL, "billingPeriod" "public"."plans_billingperiod_enum" NOT NULL, "capacity" integer NOT NULL, "status" "public"."plan_contracts_status_enum" NOT NULL DEFAULT 'ACTIVE', "startDate" date NOT NULL, "endDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "individualPayerId" uuid NOT NULL, "planId" uuid NOT NULL, CONSTRAINT "CHK_PLAN_CONTRACT_CAPACITY" CHECK ("capacity" > 0), CONSTRAINT "CHK_PLAN_CONTRACT_PRICE" CHECK ("fixedPrice" > 0), CONSTRAINT "PK_PLAN_CONTRACTS" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAN_CONTRACTS_PAYER_STATUS" ON "plan_contracts" ("individualPayerId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAN_CONTRACTS_PLAN_STATUS" ON "plan_contracts" ("planId", "status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD "contractId" uuid`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_PS_CONTRACT_PATIENT" ON "plan_subscriptions" ("contractId", "patientId") WHERE "contractId" IS NOT NULL AND "status" IN ('ACTIVE', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_contracts" ADD CONSTRAINT "FK_PLAN_CONTRACT_PAYER" FOREIGN KEY ("individualPayerId") REFERENCES "individual_payers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_contracts" ADD CONSTRAINT "FK_PLAN_CONTRACT_PLAN" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_PLAN_SUBSCRIPTION_CONTRACT" FOREIGN KEY ("contractId") REFERENCES "plan_contracts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "plan_contracts")
          OR EXISTS (
            SELECT 1 FROM "plan_subscriptions"
            WHERE "contractId" IS NOT NULL OR "payerType"::text = 'INDIVIDUAL'
          ) THEN
          RAISE EXCEPTION 'Cannot roll back plan contracts while contract data exists';
        END IF;
      END $$
    `);
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_PLAN_SUBSCRIPTION_CONTRACT"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_contracts" DROP CONSTRAINT "FK_PLAN_CONTRACT_PLAN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_contracts" DROP CONSTRAINT "FK_PLAN_CONTRACT_PAYER"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_PS_CONTRACT_PATIENT"`);
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP COLUMN "contractId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PLAN_CONTRACTS_PLAN_STATUS"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PLAN_CONTRACTS_PAYER_STATUS"`,
    );
    await queryRunner.query(`DROP TABLE "plan_contracts"`);
    await queryRunner.query(`DROP TYPE "public"."plan_contracts_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "plans" DROP CONSTRAINT "CHK_PLANS_BENEFICIARY_CAPACITY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN "beneficiaryCapacity"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."plan_subscriptions_payertype_enum" RENAME TO "plan_subscriptions_payertype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_subscriptions_payertype_enum" AS ENUM('PATIENT', 'COMPANY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ALTER COLUMN "payerType" TYPE "public"."plan_subscriptions_payertype_enum" USING "payerType"::text::"public"."plan_subscriptions_payertype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."plan_subscriptions_payertype_enum_old"`,
    );
  }
}
