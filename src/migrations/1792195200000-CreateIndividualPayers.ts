import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndividualPayers1792195200000 implements MigrationInterface {
  name = 'CreateIndividualPayers1792195200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."individual_payers_documenttype_enum" AS ENUM('CC', 'CE', 'PASSPORT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "individual_payers" ("id" uuid NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "documentType" "public"."individual_payers_documenttype_enum" NOT NULL, "documentNumber" character varying(50) NOT NULL, "phone" character varying(20), "email" character varying(255), "address" character varying(255), "city" character varying(100), "linkedPatientId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_INDIVIDUAL_PAYERS" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_INDIVIDUAL_PAYERS_DOCUMENT_NUMBER" ON "individual_payers" ("documentNumber")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_INDIVIDUAL_PAYERS_LINKED_PATIENT" ON "individual_payers" ("linkedPatientId") WHERE "linkedPatientId" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "individual_payers" ADD CONSTRAINT "FK_INDIVIDUAL_PAYERS_LINKED_PATIENT" FOREIGN KEY ("linkedPatientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "individual_payers" DROP CONSTRAINT "FK_INDIVIDUAL_PAYERS_LINKED_PATIENT"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_INDIVIDUAL_PAYERS_LINKED_PATIENT"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_INDIVIDUAL_PAYERS_DOCUMENT_NUMBER"`,
    );
    await queryRunner.query(`DROP TABLE "individual_payers"`);
    await queryRunner.query(
      `DROP TYPE "public"."individual_payers_documenttype_enum"`,
    );
  }
}
