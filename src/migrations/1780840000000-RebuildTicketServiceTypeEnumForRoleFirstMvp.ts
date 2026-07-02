import { MigrationInterface, QueryRunner } from 'typeorm';

export class RebuildTicketServiceTypeEnumForRoleFirstMvp1780840000000 implements MigrationInterface {
  name = 'RebuildTicketServiceTypeEnumForRoleFirstMvp1780840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_servicetype_enum" RENAME TO "tickets_servicetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_servicetype_enum" AS ENUM('immediate_attention', 'telemedicine', 'home_care', 'medical_consultation', 'ambulance', 'laboratory', 'study_transfer', 'imaging', 'appointment', 'equipment_rental', 'plans')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "serviceType" TYPE "public"."tickets_servicetype_enum" USING "serviceType"::text::"public"."tickets_servicetype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tickets_servicetype_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "tickets" SET "serviceType" = 'laboratory' WHERE "serviceType" = 'imaging'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_servicetype_enum" RENAME TO "tickets_servicetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_servicetype_enum" AS ENUM('immediate_attention', 'telemedicine', 'home_care', 'medical_consultation', 'ambulance', 'laboratory', 'study_transfer', 'appointment', 'equipment_rental', 'plans')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "serviceType" TYPE "public"."tickets_servicetype_enum" USING "serviceType"::text::"public"."tickets_servicetype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tickets_servicetype_enum_old"`,
    );
  }
}
