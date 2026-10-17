import { QueryRunner } from 'typeorm';
import { CreatePlanContracts1792281600000 } from './1792281600000-CreatePlanContracts';

describe('CreatePlanContracts1792281600000', () => {
  it('allows historical beneficiary rows while keeping current coverage unique', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new CreatePlanContracts1792281600000();

    await migration.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        `CREATE UNIQUE INDEX "IDX_PS_CONTRACT_PATIENT" ON "plan_subscriptions" ("contractId", "patientId") WHERE "contractId" IS NOT NULL AND "status" IN ('ACTIVE', 'SUSPENDED')`,
      ),
    );
  });
});
