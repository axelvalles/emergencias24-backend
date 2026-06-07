import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMunicipalityPricing1780777200000 implements MigrationInterface {
  name = 'CreateMunicipalityPricing1780777200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasMunicipalityPricingTable = await queryRunner.hasTable(
      'municipality_pricing',
    );

    if (hasMunicipalityPricingTable) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "municipality_pricing" ("id" uuid NOT NULL, "municipality" character varying(100) NOT NULL, "displayOrder" integer NOT NULL, "homeCarePrice" numeric(10,2) NOT NULL, "ambulancePrice" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f0fb2962576294d60ed34353e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_MUNICIPALITY_PRICING_MUNICIPALITY" ON "municipality_pricing" ("municipality") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MUNICIPALITY_PRICING_DISPLAY_ORDER" ON "municipality_pricing" ("displayOrder") `,
    );
    await queryRunner.query(
      `INSERT INTO "municipality_pricing" ("id", "municipality", "displayOrder", "homeCarePrice", "ambulancePrice") VALUES
      ('019739f8-67a2-7e2e-b72e-c07f8abfd001', 'Mariño', 1, 55.00, 70.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd002', 'Maneiro', 2, 55.00, 70.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd003', 'García', 3, 55.00, 70.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd004', 'Arismendi', 4, 55.00, 70.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd005', 'Antolín', 5, 65.00, 90.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd006', 'Gómez', 6, 65.00, 90.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd007', 'Marcano', 7, 65.00, 90.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd008', 'Díaz', 8, 65.00, 90.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd009', 'Tubores', 9, 80.00, 110.00),
      ('019739f8-67a2-7e2e-b72e-c07f8abfd010', 'P. Macanao', 10, 80.00, 110.00)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MUNICIPALITY_PRICING_DISPLAY_ORDER"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MUNICIPALITY_PRICING_MUNICIPALITY"`,
    );
    await queryRunner.query(`DROP TABLE "municipality_pricing"`);
  }
}
