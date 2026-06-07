import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

type LegacyAmbulanceUser = {
  id: string;
  firstName: string;
  lastName: string;
};

export class CreateAmbulanceUnits1780810000000 implements MigrationInterface {
  name = 'CreateAmbulanceUnits1780810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ambulance_units" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ambulance_units_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_AMBULANCE_UNITS_NAME" ON "ambulance_units" ("name")`,
    );
    await queryRunner.query(
      `CREATE TABLE "ambulance_unit_members" ("ambulanceUnitId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_ambulance_unit_members" PRIMARY KEY ("ambulanceUnitId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AMBULANCE_UNIT_MEMBERS_UNIT" ON "ambulance_unit_members" ("ambulanceUnitId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AMBULANCE_UNIT_MEMBERS_USER" ON "ambulance_unit_members" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "activeAmbulanceUnitId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "assignedUnitId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_active_ambulance_unit" FOREIGN KEY ("activeAmbulanceUnitId") REFERENCES "ambulance_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_assigned_unit" FOREIGN KEY ("assignedUnitId") REFERENCES "ambulance_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ambulance_unit_members" ADD CONSTRAINT "FK_ambulance_unit_members_unit" FOREIGN KEY ("ambulanceUnitId") REFERENCES "ambulance_units"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ambulance_unit_members" ADD CONSTRAINT "FK_ambulance_unit_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    const ambulanceUsers = (await queryRunner.query(
      `SELECT "id", "firstName", "lastName" FROM "users" WHERE "role" = 'ambulance'`,
    )) as LegacyAmbulanceUser[];

    for (const user of ambulanceUsers) {
      const unitId = randomUUID();
      const unitName = `Unidad ${user.firstName} ${user.lastName} ${user.id.slice(0, 8)}`.trim();

      await queryRunner.query(
        `INSERT INTO "ambulance_units" ("id", "name", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())`,
        [unitId, unitName],
      );
      await queryRunner.query(
        `INSERT INTO "ambulance_unit_members" ("ambulanceUnitId", "userId") VALUES ($1, $2)`,
        [unitId, user.id],
      );
      await queryRunner.query(
        `UPDATE "users" SET "activeAmbulanceUnitId" = $1 WHERE "id" = $2`,
        [unitId, user.id],
      );
      await queryRunner.query(
        `UPDATE "tickets" SET "assignedUnitId" = $1 WHERE "assignedUserId" = $2`,
        [unitId, user.id],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_367d43d5d04a904fe04a1d641ab"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKETS_ASSIGNED"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "assignedUserId"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_ASSIGNED" ON "tickets" ("assignedUnitId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tickets" ADD "assignedUserId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_367d43d5d04a904fe04a1d641ab" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `UPDATE "tickets" ticket SET "assignedUserId" = membership."userId" FROM "ambulance_unit_members" membership WHERE membership."ambulanceUnitId" = ticket."assignedUnitId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_assigned_unit"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKETS_ASSIGNED"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_ASSIGNED" ON "tickets" ("assignedUserId", "status")`,
    );
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "assignedUnitId"`);

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_active_ambulance_unit"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "activeAmbulanceUnitId"`);

    await queryRunner.query(
      `ALTER TABLE "ambulance_unit_members" DROP CONSTRAINT "FK_ambulance_unit_members_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ambulance_unit_members" DROP CONSTRAINT "FK_ambulance_unit_members_unit"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AMBULANCE_UNIT_MEMBERS_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AMBULANCE_UNIT_MEMBERS_UNIT"`,
    );
    await queryRunner.query(`DROP TABLE "ambulance_unit_members"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AMBULANCE_UNITS_NAME"`,
    );
    await queryRunner.query(`DROP TABLE "ambulance_units"`);
  }
}
