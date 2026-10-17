import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { IndividualPayer } from '../../individual-payers/entities/individual-payer.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { AddContractBeneficiaryDto } from '../dto/add-contract-beneficiary.dto';
import { CreatePlanContractDto } from '../dto/create-plan-contract.dto';
import { QueryPlanContractsDto } from '../dto/query-plan-contracts.dto';
import {
  PlanContract,
  PlanContractStatus,
} from '../entities/plan-contract.entity';
import { Plan, PlanStatus, PlanType } from '../entities/plan.entity';
import {
  PayerType,
  PlanSubscription,
  PlanSubscriptionStatus,
} from '../entities/plan-subscription.entity';

const COVERAGE_STATUSES = [
  PlanSubscriptionStatus.ACTIVE,
  PlanSubscriptionStatus.SUSPENDED,
];

@Injectable()
export class PlanContractsService {
  constructor(
    @InjectRepository(PlanContract)
    private readonly planContractRepository: Repository<PlanContract>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePlanContractDto) {
    return this.dataSource.transaction(async (manager) => {
      const planRepository = manager.getRepository(Plan);
      const payerRepository = manager.getRepository(IndividualPayer);
      const patientRepository = manager.getRepository(Patient);
      const contractRepository = manager.getRepository(PlanContract);
      const subscriptionRepository = manager.getRepository(PlanSubscription);

      const plan = await planRepository.findOne({ where: { id: dto.planId } });
      if (!plan) throw new NotFoundException('Plan not found');
      this.validateContractPlan(plan);
      this.validateDates(dto.startDate, dto.endDate);

      const payer = await payerRepository.findOne({
        where: { id: dto.individualPayerId },
      });
      if (!payer) throw new NotFoundException('Individual payer not found');

      const uniquePatientIds = [...new Set(dto.beneficiaryPatientIds)];
      if (uniquePatientIds.length !== dto.beneficiaryPatientIds.length) {
        throw new BadRequestException('Beneficiary patients must be unique');
      }
      if (uniquePatientIds.length > plan.beneficiaryCapacity!) {
        throw new BadRequestException(
          'Beneficiary list exceeds the plan capacity',
        );
      }

      const patients = await patientRepository
        .createQueryBuilder('patient')
        .where('patient.id IN (:...patientIds)', {
          patientIds: uniquePatientIds,
        })
        .orderBy('patient.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();
      if (patients.length !== uniquePatientIds.length) {
        throw new NotFoundException(
          'One or more beneficiary patients not found',
        );
      }

      await this.ensurePatientsEligible(
        subscriptionRepository,
        uniquePatientIds,
        plan.planType,
      );

      const contract = contractRepository.create({
        individualPayer: payer,
        plan,
        fixedPrice: plan.monthlyCost,
        billingPeriod: plan.billingPeriod,
        capacity: plan.beneficiaryCapacity!,
        status: PlanContractStatus.ACTIVE,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      });
      const savedContract = await contractRepository.save(contract);

      const subscriptions = patients.map((patient) =>
        subscriptionRepository.create({
          patient,
          plan,
          contract: savedContract,
          company: null,
          payerPatient: null,
          payerType: PayerType.INDIVIDUAL,
          status: PlanSubscriptionStatus.ACTIVE,
          startDate: savedContract.startDate,
          endDate: savedContract.endDate,
        }),
      );
      const savedSubscriptions =
        await subscriptionRepository.save(subscriptions);

      return this.toResponse(savedContract, savedSubscriptions);
    });
  }

  async findAll(query: QueryPlanContractsDto = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 10), 100);
    const queryBuilder = this.planContractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.plan', 'plan')
      .leftJoinAndSelect('contract.individualPayer', 'individualPayer')
      .leftJoinAndSelect('contract.subscriptions', 'subscription')
      .leftJoinAndSelect('subscription.patient', 'patient');

    if (query.planId) {
      queryBuilder.andWhere('plan.id = :planId', { planId: query.planId });
    }
    if (query.individualPayerId) {
      queryBuilder.andWhere('individualPayer.id = :individualPayerId', {
        individualPayerId: query.individualPayerId,
      });
    }
    if (query.status) {
      queryBuilder.andWhere('contract.status = :status', {
        status: query.status,
      });
    }

    queryBuilder
      .orderBy('contract.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [contracts, total] = await queryBuilder.getManyAndCount();

    return {
      data: contracts.map((contract) =>
        this.toResponse(contract, contract.subscriptions ?? []),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const contract = await this.planContractRepository.findOne({
      where: { id },
      relations: [
        'plan',
        'individualPayer',
        'subscriptions',
        'subscriptions.patient',
      ],
    });
    if (!contract) throw new NotFoundException('Plan contract not found');

    return this.toResponse(contract, contract.subscriptions ?? []);
  }

  async addBeneficiary(id: string, dto: AddContractBeneficiaryDto) {
    return this.dataSource.transaction(async (manager) => {
      const contract = await this.findLockedContract(manager, id);
      if (contract.status !== PlanContractStatus.ACTIVE) {
        throw new BadRequestException(
          'Beneficiaries can only be added to an active contract',
        );
      }

      const subscriptionRepository = manager.getRepository(PlanSubscription);
      const activeCount = await subscriptionRepository.count({
        where: {
          contract: { id },
          status: In(COVERAGE_STATUSES),
        },
      });
      if (activeCount >= contract.capacity) {
        throw new BadRequestException('Contract beneficiary capacity reached');
      }

      const duplicate = await subscriptionRepository.findOne({
        where: {
          contract: { id },
          patient: { id: dto.patientId },
          status: In(COVERAGE_STATUSES),
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'Patient is already a beneficiary of this contract',
        );
      }

      const patient = await manager.getRepository(Patient).findOne({
        where: { id: dto.patientId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!patient) throw new NotFoundException('Patient not found');

      await this.ensurePatientsEligible(
        subscriptionRepository,
        [patient.id],
        contract.plan.planType,
      );

      const subscription = subscriptionRepository.create({
        patient,
        plan: contract.plan,
        contract,
        company: null,
        payerPatient: null,
        payerType: PayerType.INDIVIDUAL,
        status: PlanSubscriptionStatus.ACTIVE,
        startDate: contract.startDate,
        endDate: contract.endDate,
      });
      await subscriptionRepository.save(subscription);
      const subscriptions = await subscriptionRepository.find({
        where: { contract: { id } },
        relations: ['patient'],
      });

      return this.toResponse(contract, subscriptions);
    });
  }

  async removeBeneficiary(id: string, patientId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.findLockedContract(manager, id);
      const subscriptionRepository = manager.getRepository(PlanSubscription);
      const subscription = await subscriptionRepository.findOne({
        where: {
          contract: { id },
          patient: { id: patientId },
          status: In(COVERAGE_STATUSES),
        },
      });
      if (!subscription) {
        throw new NotFoundException('Contract beneficiary not found');
      }

      subscription.status = PlanSubscriptionStatus.CANCELED;
      subscription.endDate = new Date();
      await subscriptionRepository.save(subscription);
    });
  }

  private async findLockedContract(manager: EntityManager, id: string) {
    const contract = await manager.getRepository(PlanContract).findOne({
      where: { id },
      relations: ['plan', 'individualPayer'],
      lock: { mode: 'pessimistic_write' },
    });
    if (!contract) throw new NotFoundException('Plan contract not found');
    return contract;
  }

  private validateContractPlan(plan: Plan) {
    if (plan.status !== PlanStatus.ACTIVE) {
      throw new BadRequestException('Plan must be active');
    }
    if (![PlanType.FAMILY, PlanType.GROUP].includes(plan.planType)) {
      throw new BadRequestException(
        'Only family and group plans support contracts',
      );
    }
    if (!plan.monthlyCost || Number(plan.monthlyCost) <= 0) {
      throw new BadRequestException('Plan requires a positive package price');
    }
    if (
      !Number.isInteger(plan.beneficiaryCapacity) ||
      plan.beneficiaryCapacity! <= 0
    ) {
      throw new BadRequestException('Plan requires a positive capacity');
    }
  }

  private validateDates(startDateValue: string, endDateValue?: string) {
    const startDate = new Date(startDateValue);
    const endDate = endDateValue ? new Date(endDateValue) : null;
    if (endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }
  }

  private async ensurePatientsEligible(
    subscriptionRepository: Repository<PlanSubscription>,
    patientIds: string[],
    planType: PlanType,
  ) {
    const existing = await subscriptionRepository.find({
      where: {
        patient: { id: In(patientIds) },
        plan: { planType },
        status: In(COVERAGE_STATUSES),
      },
      relations: ['patient', 'plan'],
    });
    if (existing.length > 0) {
      throw new ConflictException(
        'One or more patients already have an active or suspended plan of this type',
      );
    }
  }

  private toResponse(
    contract: PlanContract,
    subscriptions: PlanSubscription[],
  ) {
    return {
      id: contract.id,
      status: contract.status,
      fixedPrice: contract.fixedPrice,
      billingPeriod: contract.billingPeriod,
      capacity: contract.capacity,
      startDate: contract.startDate,
      endDate: contract.endDate ?? null,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      plan: {
        id: contract.plan.id,
        name: contract.plan.name,
        planType: contract.plan.planType,
      },
      payer: {
        id: contract.individualPayer.id,
        firstName: contract.individualPayer.firstName,
        lastName: contract.individualPayer.lastName,
        fullName: `${contract.individualPayer.firstName} ${contract.individualPayer.lastName}`,
        documentType: contract.individualPayer.documentType,
        documentNumber: contract.individualPayer.documentNumber,
      },
      beneficiaries: subscriptions
        .filter(({ status }) => COVERAGE_STATUSES.includes(status))
        .map(({ patient }) => ({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          fullName: `${patient.firstName} ${patient.lastName}`,
          documentType: patient.documentType,
          documentNumber: patient.documentNumber,
        })),
    };
  }
}
