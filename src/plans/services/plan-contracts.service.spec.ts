import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IndividualPayer } from '../../individual-payers/entities/individual-payer.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { PlanContract } from '../entities/plan-contract.entity';
import {
  Plan,
  PlanBillingPeriod,
  PlanStatus,
  PlanType,
} from '../entities/plan.entity';
import {
  PlanSubscription,
  PlanSubscriptionStatus,
  PayerType,
} from '../entities/plan-subscription.entity';
import { PlanContractsService } from './plan-contracts.service';

describe('PlanContractsService', () => {
  const plan = {
    id: '0199f376-0b8a-7000-8000-000000000001',
    name: 'Family 3',
    planType: PlanType.FAMILY,
    status: PlanStatus.ACTIVE,
    monthlyCost: '150000.00',
    billingPeriod: PlanBillingPeriod.MONTHLY,
    beneficiaryCapacity: 3,
  };
  const payer = {
    id: '0199f376-0b8a-7000-8000-000000000002',
    firstName: 'Ana',
    lastName: 'Pérez',
    documentType: 'CC',
    documentNumber: '1000',
    linkedPatient: {
      id: 'linked-patient',
      allergies: 'Sensitive',
      medicalConditions: 'Sensitive',
    },
  };
  const patients = [
    {
      id: '0199f376-0b8a-7000-8000-000000000003',
      firstName: 'Luis',
      lastName: 'Pérez',
      documentType: 'CC',
      documentNumber: '2000',
      allergies: 'Penicillin',
      medicalConditions: 'Asthma',
    },
    {
      id: '0199f376-0b8a-7000-8000-000000000004',
      firstName: 'Marta',
      lastName: 'Pérez',
      documentType: 'CC',
      documentNumber: '3000',
    },
  ];

  function createHarness() {
    const planRepository = { findOne: jest.fn().mockResolvedValue(plan) };
    const payerRepository = { findOne: jest.fn().mockResolvedValue(payer) };
    const patientQueryBuilder = {
      where: jest.fn(),
      orderBy: jest.fn(),
      setLock: jest.fn(),
      getMany: jest.fn().mockResolvedValue(patients),
    };
    patientQueryBuilder.where.mockReturnValue(patientQueryBuilder);
    patientQueryBuilder.orderBy.mockReturnValue(patientQueryBuilder);
    patientQueryBuilder.setLock.mockReturnValue(patientQueryBuilder);
    const patientRepository = {
      find: jest.fn().mockResolvedValue(patients),
      findOne: jest.fn().mockResolvedValue(patients[0]),
      createQueryBuilder: jest.fn().mockReturnValue(patientQueryBuilder),
    };
    const contractRepository = {
      create: jest.fn((value: object) => ({ id: 'contract-1', ...value })),
      save: jest.fn((value: object) => Promise.resolve(value)),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    const subscriptionRepository = {
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => Promise.resolve(value)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      remove: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Plan) return planRepository;
        if (entity === IndividualPayer) return payerRepository;
        if (entity === Patient) return patientRepository;
        if (entity === PlanContract) return contractRepository;
        if (entity === PlanSubscription) return subscriptionRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn((work: (value: typeof manager) => unknown) =>
        Promise.resolve(work(manager)),
      ),
    };
    const service = new PlanContractsService(
      contractRepository as never,
      dataSource as unknown as DataSource,
    );

    return {
      service,
      planRepository,
      payerRepository,
      patientRepository,
      patientQueryBuilder,
      contractRepository,
      subscriptionRepository,
    };
  }

  const createDto = {
    planId: plan.id,
    individualPayerId: payer.id,
    beneficiaryPatientIds: patients.map((patient) => patient.id),
    startDate: '2026-10-17',
  };

  it('atomically creates a fixed-price contract and patient coverage rows', async () => {
    const harness = createHarness();

    const result = await harness.service.create(createDto);

    expect(harness.subscriptionRepository.create).toHaveBeenCalledTimes(2);
    expect(harness.patientQueryBuilder.setLock).toHaveBeenCalledWith(
      'pessimistic_write',
    );
    expect(harness.subscriptionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payerType: PayerType.INDIVIDUAL,
        plan,
        patient: patients[0],
        contract: expect.objectContaining({ id: 'contract-1' }),
      }),
    );
    expect(result.fixedPrice).toBe('150000.00');
    expect(result.capacity).toBe(3);
    expect(result.payer).toEqual(
      expect.objectContaining({ id: payer.id, fullName: 'Ana Pérez' }),
    );
    expect(result.payer).not.toHaveProperty('linkedPatient');
    expect(result.beneficiaries).toHaveLength(2);
    expect(result.beneficiaries[0]).not.toHaveProperty('allergies');
    expect(result.beneficiaries[0]).not.toHaveProperty('medicalConditions');
  });

  it.each([
    { ...plan, status: PlanStatus.INACTIVE },
    { ...plan, planType: PlanType.CORPORATE },
    { ...plan, monthlyCost: null },
    { ...plan, beneficiaryCapacity: null },
  ])(
    'rejects a plan with invalid package configuration',
    async (invalidPlan) => {
      const harness = createHarness();
      harness.planRepository.findOne.mockResolvedValue(invalidPlan);

      await expect(harness.service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    },
  );

  it('rejects an initial beneficiary list over capacity', async () => {
    const harness = createHarness();
    harness.planRepository.findOne.mockResolvedValue({
      ...plan,
      beneficiaryCapacity: 1,
    });

    await expect(harness.service.create(createDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a missing individual payer', async () => {
    const harness = createHarness();
    harness.payerRepository.findOne.mockResolvedValue(null);

    await expect(harness.service.create(createDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a missing beneficiary patient', async () => {
    const harness = createHarness();
    harness.patientQueryBuilder.getMany.mockResolvedValue([patients[0]]);

    await expect(harness.service.create(createDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects an invalid contract date range', async () => {
    const harness = createHarness();

    await expect(
      harness.service.create({
        ...createDto,
        startDate: '2026-10-18',
        endDate: '2026-10-17',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects beneficiaries with an existing active plan of the same type', async () => {
    const harness = createHarness();
    harness.subscriptionRepository.find.mockResolvedValue([
      { patient: patients[0], plan },
    ]);

    await expect(harness.service.create(createDto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('locks the contract and rejects additions over snapshotted capacity', async () => {
    const harness = createHarness();
    harness.contractRepository.findOne.mockResolvedValue({
      id: 'contract-1',
      plan,
      individualPayer: payer,
      status: 'ACTIVE',
      capacity: 2,
      fixedPrice: plan.monthlyCost,
      billingPeriod: plan.billingPeriod,
      startDate: new Date('2026-10-17'),
      endDate: null,
    });
    harness.subscriptionRepository.count.mockResolvedValue(2);

    await expect(
      harness.service.addBeneficiary('contract-1', {
        patientId: patients[0].id,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(harness.contractRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });

  it('cancels beneficiary coverage immediately without deleting its history', async () => {
    const harness = createHarness();
    harness.contractRepository.findOne.mockResolvedValue({
      id: 'contract-1',
      plan,
      individualPayer: payer,
      status: 'ACTIVE',
      capacity: 3,
      fixedPrice: plan.monthlyCost,
      billingPeriod: plan.billingPeriod,
      startDate: new Date('2026-10-17'),
      endDate: null,
    });
    const coverage = {
      id: 'coverage-1',
      patient: patients[0],
      contract: { id: 'contract-1' },
      status: PlanSubscriptionStatus.ACTIVE,
      endDate: null,
    };
    harness.subscriptionRepository.findOne.mockResolvedValue(coverage);

    jest.useFakeTimers().setSystemTime(new Date('2026-10-17T15:00:00.000Z'));
    try {
      await harness.service.removeBeneficiary('contract-1', patients[0].id);
    } finally {
      jest.useRealTimers();
    }

    expect(harness.subscriptionRepository.save).toHaveBeenCalledWith(coverage);
    expect(coverage.status).toBe(PlanSubscriptionStatus.CANCELED);
    expect(coverage.endDate).toEqual(new Date('2026-10-17T15:00:00.000Z'));
    expect(harness.subscriptionRepository.remove).not.toHaveBeenCalled();
    expect(harness.contractRepository.save).not.toHaveBeenCalled();
  });

  it('re-adds a canceled beneficiary while preserving the historical row', async () => {
    const harness = createHarness();
    const contract = {
      id: 'contract-1',
      plan,
      individualPayer: payer,
      status: 'ACTIVE',
      capacity: 3,
      fixedPrice: plan.monthlyCost,
      billingPeriod: plan.billingPeriod,
      startDate: new Date('2026-10-17'),
      endDate: null,
    };
    const historicalCoverage = {
      id: 'coverage-1',
      patient: patients[0],
      contract: { id: contract.id },
      status: PlanSubscriptionStatus.ACTIVE,
      endDate: null,
    };
    harness.contractRepository.findOne.mockResolvedValue(contract);
    harness.subscriptionRepository.findOne
      .mockResolvedValueOnce(historicalCoverage)
      .mockResolvedValueOnce(null);

    jest.useFakeTimers().setSystemTime(new Date('2026-10-17T15:00:00.000Z'));
    try {
      await harness.service.removeBeneficiary(contract.id, patients[0].id);
    } finally {
      jest.useRealTimers();
    }

    const replacementCoverage = {
      id: 'coverage-2',
      patient: patients[0],
      contract,
      plan,
      payerType: PayerType.INDIVIDUAL,
      status: PlanSubscriptionStatus.ACTIVE,
      startDate: contract.startDate,
      endDate: contract.endDate,
    };
    harness.subscriptionRepository.create.mockReturnValue(replacementCoverage);
    harness.subscriptionRepository.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([historicalCoverage, replacementCoverage]);

    const result = await harness.service.addBeneficiary(contract.id, {
      patientId: patients[0].id,
    });

    expect(harness.subscriptionRepository.remove).not.toHaveBeenCalled();
    expect(harness.subscriptionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'coverage-1',
        status: PlanSubscriptionStatus.CANCELED,
      }),
    );
    expect(harness.subscriptionRepository.save).toHaveBeenCalledWith(
      replacementCoverage,
    );
    expect(result.beneficiaries).toEqual([
      expect.objectContaining({ id: patients[0].id }),
    ]);
  });

  it('exposes only active or suspended beneficiaries in contract responses', async () => {
    const harness = createHarness();
    harness.contractRepository.findOne.mockResolvedValue({
      id: 'contract-1',
      plan,
      individualPayer: payer,
      status: 'ACTIVE',
      capacity: 3,
      fixedPrice: plan.monthlyCost,
      billingPeriod: plan.billingPeriod,
      startDate: new Date('2026-10-17'),
      endDate: null,
      subscriptions: [
        {
          patient: patients[0],
          status: PlanSubscriptionStatus.CANCELED,
        },
        {
          patient: patients[1],
          status: PlanSubscriptionStatus.SUSPENDED,
        },
      ],
    });

    const result = await harness.service.findOne('contract-1');

    expect(result.beneficiaries).toEqual([
      expect.objectContaining({ id: patients[1].id }),
    ]);
  });
});
