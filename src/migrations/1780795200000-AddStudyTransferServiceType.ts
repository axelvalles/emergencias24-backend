import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudyTransferServiceType1780795200000
  implements MigrationInterface
{
  name = 'AddStudyTransferServiceType1780795200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_servicetype_enum" ADD VALUE IF NOT EXISTS 'study_transfer'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "tickets" SET "serviceType" = 'ambulance' WHERE "serviceType" = 'study_transfer'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_servicetype_enum" RENAME TO "tickets_servicetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_servicetype_enum" AS ENUM('immediate_attention', 'telemedicine', 'home_care', 'medical_consultation', 'ambulance', 'laboratory', 'appointment', 'equipment_rental', 'plans')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "serviceType" TYPE "public"."tickets_servicetype_enum" USING "serviceType"::text::"public"."tickets_servicetype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tickets_servicetype_enum_old"`);
  }
}
