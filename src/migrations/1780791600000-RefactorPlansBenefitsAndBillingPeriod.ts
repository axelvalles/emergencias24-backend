import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorPlansBenefitsAndBillingPeriod1780791600000
  implements MigrationInterface
{
  name = 'RefactorPlansBenefitsAndBillingPeriod1780791600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(
      `CREATE TYPE "public"."plan_benefits_valuetype_enum" AS ENUM('QUANTITY', 'DISCOUNT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_billingperiod_enum" AS ENUM('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "benefits" ("id" uuid NOT NULL, "name" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_6f3c4ddc0582d86fda91f8db241" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BENEFITS_NAME" ON "benefits" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_benefits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "planId" uuid NOT NULL, "benefitId" uuid NOT NULL, "valueType" "public"."plan_benefits_valuetype_enum" NOT NULL, "quantity" integer, "isUnlimited" boolean NOT NULL DEFAULT false, "discountPercentage" numeric(5,2), CONSTRAINT "PK_330c6cc00f4a6fd756daebc7ffb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_PLAN_BENEFITS_PLAN_BENEFIT" ON "plan_benefits" ("planId", "benefitId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "billingPeriod" "public"."plans_billingperiod_enum" NOT NULL DEFAULT 'MONTHLY'`,
    );
    await queryRunner.query(`ALTER TABLE "plans" ADD "benefitsNotes" text`);
    await queryRunner.query(
      `INSERT INTO "benefits" ("id", "name") VALUES
      ('01974a00-78b2-7f10-9000-000000000001', 'Telemedicina'),
      ('01974a00-78b2-7f10-9000-000000000002', 'Entrega de medicamentos'),
      ('01974a00-78b2-7f10-9000-000000000003', 'Traslado en ambulancia'),
      ('01974a00-78b2-7f10-9000-000000000004', 'Cuidado en casa'),
      ('01974a00-78b2-7f10-9000-000000000005', 'Cuidado en el trabajo'),
      ('01974a00-78b2-7f10-9000-000000000006', 'Sala de emergencias'),
      ('01974a00-78b2-7f10-9000-000000000007', 'Consultas especializadas'),
      ('01974a00-78b2-7f10-9000-000000000008', 'Pruebas de laboratorio')`,
    );
    await queryRunner.query(
      `UPDATE "plans" SET "benefitsNotes" = NULLIF("benefits"->>'notes', '')`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000001', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'telemedicine')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000002', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'medicationDelivery')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000003', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'ambulanceTransfer')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000004', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'homeCare')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000005', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'workplaceCare')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000006', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'emergencyRoom')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000007', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'specializedConsultations')::boolean, false) = true`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_benefits" ("planId", "benefitId", "valueType", "isUnlimited")
      SELECT "id", '01974a00-78b2-7f10-9000-000000000008', 'QUANTITY', true
      FROM "plans"
      WHERE COALESCE(("benefits"->>'labTests')::boolean, false) = true`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "benefits"`);
    await queryRunner.query(
      `ALTER TABLE "plan_benefits" ADD CONSTRAINT "FK_PLAN_BENEFITS_PLAN" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_benefits" ADD CONSTRAINT "FK_PLAN_BENEFITS_BENEFIT" FOREIGN KEY ("benefitId") REFERENCES "benefits"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan_benefits" DROP CONSTRAINT "FK_PLAN_BENEFITS_BENEFIT"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_benefits" DROP CONSTRAINT "FK_PLAN_BENEFITS_PLAN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "benefits" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `UPDATE "plans" SET "benefits" = jsonb_build_object(
        'telemedicine', false,
        'medicationDelivery', false,
        'ambulanceTransfer', false,
        'homeCare', false,
        'workplaceCare', false,
        'emergencyRoom', false,
        'specializedConsultations', false,
        'labTests', false,
        'notes', "benefitsNotes"
      )`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{telemedicine}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000001'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{medicationDelivery}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000002'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{ambulanceTransfer}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000003'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{homeCare}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000004'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{workplaceCare}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000005'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{emergencyRoom}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000006'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{specializedConsultations}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000007'`,
    );
    await queryRunner.query(
      `UPDATE "plans" p SET "benefits" = jsonb_set(p."benefits", '{labTests}', 'true'::jsonb)
      FROM "plan_benefits" pb WHERE pb."planId" = p."id" AND pb."benefitId" = '01974a00-78b2-7f10-9000-000000000008'`,
    );
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "benefitsNotes"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "billingPeriod"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PLAN_BENEFITS_PLAN_BENEFIT"`);
    await queryRunner.query(`DROP TABLE "plan_benefits"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_BENEFITS_NAME"`);
    await queryRunner.query(`DROP TABLE "benefits"`);
    await queryRunner.query(`DROP TYPE "public"."plans_billingperiod_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plan_benefits_valuetype_enum"`);
  }
}
