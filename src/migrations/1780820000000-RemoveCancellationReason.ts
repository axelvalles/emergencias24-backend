import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCancellationReason1780820000000
  implements MigrationInterface
{
  name = 'RemoveCancellationReason1780820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets" DROP COLUMN IF EXISTS "cancellationReason"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "cancellationReason" text
    `);
  }
}
