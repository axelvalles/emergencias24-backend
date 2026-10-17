import { BadRequestException } from '@nestjs/common';
import { PlanBillingPeriod, PlanType } from '../entities/plan.entity';
import { PlansService } from './plans.service';

describe('PlansService package validation', () => {
  it.each([PlanType.FAMILY, PlanType.GROUP])(
    'requires beneficiary capacity when creating a %s plan',
    async (planType) => {
      const planRepository = {
        create: jest.fn(),
        save: jest.fn(),
      };
      const service = new PlansService(
        planRepository as never,
        { findBy: jest.fn() } as never,
        { delete: jest.fn(), create: jest.fn(), save: jest.fn() } as never,
        {} as never,
      );

      await expect(
        service.create({
          name: 'Package',
          planType,
          billingPeriod: PlanBillingPeriod.MONTHLY,
          monthlyCost: '100000',
          planBenefits: [],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(planRepository.create).not.toHaveBeenCalled();
    },
  );
});
