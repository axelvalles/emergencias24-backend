import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePlanDto } from './create-plan.dto';
import { AddContractBeneficiaryDto } from './add-contract-beneficiary.dto';
import { CreatePlanContractDto } from './create-plan-contract.dto';
import { PlanBillingPeriod, PlanType } from '../entities/plan.entity';

describe('Plan contract DTOs', () => {
  const planId = '0199f376-0b8a-7000-8000-000000000001';
  const payerId = '0199f376-0b8a-7000-8000-000000000002';
  const patientId = '0199f376-0b8a-7000-8000-000000000003';

  it('accepts a fixed-package contract with explicit beneficiaries', async () => {
    const dto = plainToInstance(CreatePlanContractDto, {
      planId,
      individualPayerId: payerId,
      beneficiaryPatientIds: [patientId],
      startDate: '2026-10-17',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty or duplicate initial beneficiaries', async () => {
    const emptyDto = plainToInstance(CreatePlanContractDto, {
      planId,
      individualPayerId: payerId,
      beneficiaryPatientIds: [],
      startDate: '2026-10-17',
    });
    const duplicateDto = plainToInstance(CreatePlanContractDto, {
      planId,
      individualPayerId: payerId,
      beneficiaryPatientIds: [patientId, patientId],
      startDate: '2026-10-17',
    });

    expect(
      (await validate(emptyDto)).some(
        (error) => error.property === 'beneficiaryPatientIds',
      ),
    ).toBe(true);
    expect(
      (await validate(duplicateDto)).some(
        (error) => error.property === 'beneficiaryPatientIds',
      ),
    ).toBe(true);
  });

  it('validates a beneficiary patient id', async () => {
    const dto = plainToInstance(AddContractBeneficiaryDto, {
      patientId: 'not-a-uuid',
    });

    expect(
      (await validate(dto)).some((error) => error.property === 'patientId'),
    ).toBe(true);
  });

  it('rejects a non-positive plan beneficiary capacity', async () => {
    const dto = plainToInstance(CreatePlanDto, {
      name: 'Family package',
      planType: PlanType.FAMILY,
      billingPeriod: PlanBillingPeriod.MONTHLY,
      monthlyCost: '100000',
      beneficiaryCapacity: 0,
      planBenefits: [],
    });

    expect(
      (await validate(dto)).some(
        (error) => error.property === 'beneficiaryCapacity',
      ),
    ).toBe(true);
  });
});
