import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketCurrentOwnerRole1780850000000 implements MigrationInterface {
  name = 'AddTicketCurrentOwnerRole1780850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_currentownerrole_enum" AS ENUM('paramedic', 'doctor', 'appointment_manager', 'marketing', 'dispatcher', 'emergency_room')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "currentOwnerRole" "public"."tickets_currentownerrole_enum"`,
    );
    await queryRunner.query(
      `UPDATE "tickets" SET "currentOwnerRole" = CASE
        WHEN "serviceType" IN ('immediate_attention', 'ambulance', 'home_care', 'study_transfer') THEN 'paramedic'::"public"."tickets_currentownerrole_enum"
        WHEN "serviceType" IN ('telemedicine', 'medical_consultation') THEN 'doctor'::"public"."tickets_currentownerrole_enum"
        WHEN "serviceType" IN ('laboratory', 'imaging') THEN 'appointment_manager'::"public"."tickets_currentownerrole_enum"
        WHEN "serviceType" = 'plans' THEN 'marketing'::"public"."tickets_currentownerrole_enum"
        ELSE NULL
      END`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_OWNER_ROLE_STATUS" ON "tickets" ("currentOwnerRole", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_OWNER_ROLE_CREATED" ON "tickets" ("currentOwnerRole", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" ADD "ownerRoleAtChange" "public"."tickets_currentownerrole_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" ADD "assignedUnitIdSnapshot" uuid`,
    );
    await queryRunner.query(
      `UPDATE "ticket_status_history" history SET "ownerRoleAtChange" = ticket."currentOwnerRole", "assignedUnitIdSnapshot" = ticket."assignedUnitId" FROM "tickets" ticket WHERE ticket."id" = history."ticketId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_role_handoffs" ("id" uuid NOT NULL, "fromOwnerRole" "public"."tickets_currentownerrole_enum", "toOwnerRole" "public"."tickets_currentownerrole_enum" NOT NULL, "fromAssignedUnitId" uuid, "toAssignedUnitId" uuid, "reason" text, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ticketId" uuid, "changedById" uuid, CONSTRAINT "PK_ticket_role_handoffs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKET_ROLE_HANDOFFS_TICKET_CREATED" ON "ticket_role_handoffs" ("ticketId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_role_handoffs" ADD CONSTRAINT "FK_ticket_role_handoffs_ticket" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_role_handoffs" ADD CONSTRAINT "FK_ticket_role_handoffs_changed_by" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_role_handoffs" DROP CONSTRAINT "FK_ticket_role_handoffs_changed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_role_handoffs" DROP CONSTRAINT "FK_ticket_role_handoffs_ticket"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_TICKET_ROLE_HANDOFFS_TICKET_CREATED"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_role_handoffs"`);
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" DROP COLUMN "assignedUnitIdSnapshot"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_status_history" DROP COLUMN "ownerRoleAtChange"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_TICKETS_OWNER_ROLE_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_TICKETS_OWNER_ROLE_STATUS"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP COLUMN "currentOwnerRole"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tickets_currentownerrole_enum"`,
    );
  }
}
