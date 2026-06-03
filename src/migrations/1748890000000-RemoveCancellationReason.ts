import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCancellationReason1748890000000 implements MigrationInterface {
  name = 'RemoveCancellationReason1748890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets" DROP COLUMN IF EXISTS "cancellationReason"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets" ADD COLUMN "cancellationReason" text
    `);
  }
}
