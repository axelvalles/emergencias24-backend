import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1765316296307 implements MigrationInterface {
  name = 'Migration1765316296307_initial';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "phone" character varying(20), "email" character varying(100) NOT NULL, "password_hash" character varying(255) NOT NULL, "roles" "public"."users_roles_enum" NOT NULL DEFAULT 'clinic_admin', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "last_login" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "birth_date" date, "gender" "public"."patients_gender_enum" NOT NULL, "document_type" "public"."patients_document_type_enum" NOT NULL, "document_number" character varying(50) NOT NULL, "address" character varying(255), "city" character varying(100), "state" character varying(100), "zip_code" character varying(20), "phone" character varying(20), "secondary_phone" character varying(20), "emergency_contact_name" character varying(255), "emergency_contact_phone" character varying(20), "blood_type" "public"."patients_blood_type_enum", "allergies" text, "medical_conditions" text, "patient_status" "public"."patients_patient_status_enum" NOT NULL DEFAULT 'Active', "medical_record_number" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, CONSTRAINT "UQ_85bcb7ae36549e3eb85686078d0" UNIQUE ("document_number"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_subscriptions_role_enum" AS ENUM('HOLDER', 'BENEFICIARY', 'MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_subscriptions_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" uuid NOT NULL, "plan_group_id" uuid NOT NULL, "role" "public"."plan_subscriptions_role_enum" NOT NULL, "status" "public"."plan_subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "start_date" date NOT NULL, "end_date" date, "monthly_cost" numeric(10,2), "annual_cost" numeric(10,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_fbecd15ea78b4de498d0b0b4b00" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_groups_group_type_enum" AS ENUM('FAMILY', 'CORPORATE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "group_type" "public"."plan_groups_group_type_enum" NOT NULL, "company_id" uuid, "holder_id" uuid, "entity_name" character varying(255) NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_8d3129e9affc5950fd53217990a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "plan_type" "public"."plans_plan_type_enum" NOT NULL, "group_category" "public"."plans_group_category_enum", "min_members" integer, "benefits" json NOT NULL, "status" "public"."plans_status_enum" NOT NULL DEFAULT 'ACTIVE', "monthly_cost" numeric(10,2), "annual_cost" numeric(10,2), "valid_from" date, "valid_until" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referenceNumber" SERIAL NOT NULL, "serviceType" "public"."tickets_servicetype_enum" NOT NULL, "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."tickets_priority_enum" NOT NULL DEFAULT 'medium', "patientId" uuid, "requesterPhone" character varying NOT NULL, "requesterName" text, "location" text, "municipality" text, "speciality" text, "description" text, "note" text, "cancellationReason" text, "assignedTo" uuid, "assignedAt" TIMESTAMP, "completedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8caf8d7250f1338ba6f283d3c0e" UNIQUE ("referenceNumber"), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_8e7901df531b6a35f19ff4de500" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_7e88ddf0c7d81b881453f0c013e" FOREIGN KEY ("plan_group_id") REFERENCES "plan_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_groups" ADD CONSTRAINT "FK_e1babae9bfce1abd3856ab65a28" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_7c2894ec48d1aeeb9a57680ab12" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_d1beac6cf7fa5a0742a693c9aa9" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_d1beac6cf7fa5a0742a693c9aa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_7c2894ec48d1aeeb9a57680ab12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_groups" DROP CONSTRAINT "FK_e1babae9bfce1abd3856ab65a28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_7e88ddf0c7d81b881453f0c013e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_8e7901df531b6a35f19ff4de500"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "plan_groups"`);
    await queryRunner.query(`DROP TYPE "public"."plan_groups_group_type_enum"`);
    await queryRunner.query(`DROP TABLE "plan_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."plan_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."plan_subscriptions_role_enum"`,
    );
    await queryRunner.query(`DROP TABLE "patients"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
