import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1766518943238 implements MigrationInterface {
  name = 'Migration1766518943238';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('superAdmin', 'clinicAdmin', 'operator', 'doctor', 'nurse', 'receptionist', 'labAdmin', 'finance')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "phone" character varying(20), "email" character varying(100) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'clinicAdmin', "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastLogin" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USERS_ROLE_STATUS" ON "users" ("role", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USERS_STATUS" ON "users" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_plantype_enum" AS ENUM('FAMILY', 'CORPORATE', 'GROUP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "benefits" jsonb NOT NULL, "planType" "public"."plans_plantype_enum" NOT NULL, "status" "public"."plans_status_enum" NOT NULL DEFAULT 'ACTIVE', "monthlyCost" numeric(10,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLANS_NAME" ON "plans" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLANS_PLAN_TYPE" ON "plans" ("planType") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."companies_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "companies" ("id" uuid NOT NULL, "name" character varying(255) NOT NULL, "taxId" character varying(50) NOT NULL, "contactEmail" character varying(255) NOT NULL, "contactPhone" character varying(20) NOT NULL, "status" "public"."companies_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COMPANIES_NAME" ON "companies" ("name") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_COMPANIES_TAX_ID" ON "companies" ("taxId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COMPANIES_CONTACT_EMAIL" ON "companies" ("contactEmail") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COMPANIES_CONTACT_PHONE" ON "companies" ("contactPhone") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COMPANIES_CREATED_AT" ON "companies" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_subscriptions_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'CANCELED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_subscriptions_payertype_enum" AS ENUM('PATIENT', 'COMPANY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_subscriptions" ("id" uuid NOT NULL, "status" "public"."plan_subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "payerType" "public"."plan_subscriptions_payertype_enum" NOT NULL, "startDate" date NOT NULL, "endDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid NOT NULL, "planId" uuid NOT NULL, "companyId" uuid, "payer_patient_id" uuid, CONSTRAINT "PK_fbecd15ea78b4de498d0b0b4b00" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PS_PAYER_PATIENT" ON "plan_subscriptions" ("payer_patient_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PS_COMPANY_ACTIVE" ON "plan_subscriptions" ("companyId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PS_PATIENT_ACTIVE" ON "plan_subscriptions" ("patientId", "status", "startDate", "endDate") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_gender_enum" AS ENUM('Male', 'Female')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_documenttype_enum" AS ENUM('CC', 'CE', 'PASSPORT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_bloodtype_enum" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_status_enum" AS ENUM('Active', 'Inactive', 'Deceased')`,
    );
    await queryRunner.query(
      `CREATE TABLE "patients" ("id" uuid NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "birthDate" date, "gender" "public"."patients_gender_enum" NOT NULL, "documentType" "public"."patients_documenttype_enum" NOT NULL, "documentNumber" character varying(50) NOT NULL, "address" character varying(255), "city" character varying(100), "state" character varying(100), "zipCode" character varying(20), "phone" character varying(20), "secondaryPhone" character varying(20), "emergencyContactName" character varying(255), "emergencyContactPhone" character varying(20), "bloodType" "public"."patients_bloodtype_enum", "allergies" text, "medicalConditions" text, "status" "public"."patients_status_enum" NOT NULL DEFAULT 'Active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP, CONSTRAINT "UQ_a7442e2ceeffc71f8a3abfd52c4" UNIQUE ("documentNumber"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_servicetype_enum" AS ENUM('immediate_attention', 'telemedicine', 'home_care', 'medical_consultation', 'ambulance', 'laboratory', 'appointment', 'equipment_rental', 'plans')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_status_enum" AS ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_priority_enum" AS ENUM('low', 'medium', 'high')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL, "referenceNumber" SERIAL NOT NULL, "serviceType" "public"."tickets_servicetype_enum" NOT NULL, "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."tickets_priority_enum" NOT NULL DEFAULT 'medium', "requesterPhone" character varying NOT NULL, "requesterName" text, "location" text, "municipality" text, "speciality" text, "description" text, "note" text, "cancellationReason" text, "assignedAt" TIMESTAMP, "completedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid, "assignedUserId" uuid, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_PATIENT" ON "tickets" ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_ASSIGNED" ON "tickets" ("assignedUserId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_STATUS_CREATED" ON "tickets" ("status", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_status_history_status_enum" AS ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_status_history" ("id" uuid NOT NULL, "status" "public"."ticket_status_history_status_enum" NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ticketId" uuid, "changedById" uuid, CONSTRAINT "PK_d989dae9e6078a6d4ce1aca63f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_f7215fc5dcfd400847633533a71" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_9cb48a82b208ef7c5ee0a270f33" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_63d43cd2acd0c07da183c2fb9f5" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" ADD CONSTRAINT "FK_99d086dc95bb93efd7b842c412d" FOREIGN KEY ("payer_patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_7c2894ec48d1aeeb9a57680ab12" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_367d43d5d04a904fe04a1d641ab" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" ADD CONSTRAINT "FK_0de84a4d632c941c38a3a9b481a" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" ADD CONSTRAINT "FK_2bbf8256d8ae1aa0312470b9a16" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" DROP CONSTRAINT "FK_2bbf8256d8ae1aa0312470b9a16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" DROP CONSTRAINT "FK_0de84a4d632c941c38a3a9b481a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_367d43d5d04a904fe04a1d641ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_7c2894ec48d1aeeb9a57680ab12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_99d086dc95bb93efd7b842c412d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_63d43cd2acd0c07da183c2fb9f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_9cb48a82b208ef7c5ee0a270f33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_subscriptions" DROP CONSTRAINT "FK_f7215fc5dcfd400847633533a71"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_status_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."ticket_status_history_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKETS_STATUS_CREATED"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKETS_ASSIGNED"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKETS_PATIENT"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_servicetype_enum"`);
    await queryRunner.query(`DROP TABLE "patients"`);
    await queryRunner.query(`DROP TYPE "public"."patients_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_bloodtype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_documenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_gender_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PS_PATIENT_ACTIVE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PS_COMPANY_ACTIVE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PS_PAYER_PATIENT"`);
    await queryRunner.query(`DROP TABLE "plan_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."plan_subscriptions_payertype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."plan_subscriptions_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_COMPANIES_CREATED_AT"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_COMPANIES_CONTACT_PHONE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_COMPANIES_CONTACT_EMAIL"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_COMPANIES_TAX_ID"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_COMPANIES_NAME"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TYPE "public"."companies_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PLANS_PLAN_TYPE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PLANS_NAME"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TYPE "public"."plans_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plans_plantype_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USERS_STATUS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USERS_ROLE_STATUS"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
