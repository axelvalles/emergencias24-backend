import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PlanSubscription } from '../entities/plan-subscription.entity';
import { CreatePlanSubscriptionDto } from '../dto/create-plan-subscription.dto';
import { UpdatePlanSubscriptionDto } from '../dto/update-plan-subscription.dto';
import { QueryPlanSubscriptionsDto } from '../dto/query-plan-subscriptions.dto';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    @InjectRepository(PlanSubscription)
    private readonly planSubscriptionRepository: Repository<PlanSubscription>,
  ) {}

  async create(
    createPlanSubscriptionDto: CreatePlanSubscriptionDto,
  ): Promise<PlanSubscription> {
    const subscription = this.planSubscriptionRepository.create({
      ...createPlanSubscriptionDto,
      patient: { id: createPlanSubscriptionDto.patientId },
      plan: { id: createPlanSubscriptionDto.planId },
      company: createPlanSubscriptionDto.companyId
        ? { id: createPlanSubscriptionDto.companyId }
        : null,
    });
    return this.planSubscriptionRepository.save(subscription);
  }

  async findAll(queryDto: QueryPlanSubscriptionsDto = {}): Promise<{
    data: PlanSubscription[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...rawFilters
    } = queryDto;

    const currentPage = Math.max(1, page);
    const sanitizedLimit = Math.min(Math.max(1, limit), 100);
    const filters = rawFilters as PlanSubscriptionFilters;

    const queryBuilder = this.planSubscriptionRepository
      .createQueryBuilder('planSubscription')
      .leftJoinAndSelect('planSubscription.patient', 'patient')
      .leftJoinAndSelect('planSubscription.plan', 'plan')
      .leftJoinAndSelect('planSubscription.company', 'company');

    this.applyFilters(queryBuilder, filters);
    this.applySorting(queryBuilder, sortBy, sortOrder);

    const skip = (currentPage - 1) * sanitizedLimit;
    queryBuilder.skip(skip).take(sanitizedLimit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: currentPage,
      limit: sanitizedLimit,
      totalPages: Math.ceil(total / sanitizedLimit),
    };
  }

  async findOne(id: string): Promise<PlanSubscription> {
    const subscription = await this.planSubscriptionRepository.findOne({
      where: { id },
      relations: ['patient', 'plan', 'company'],
    });

    if (!subscription) {
      throw new NotFoundException(`PlanSubscription with ID ${id} not found`);
    }

    return subscription;
  }

  async update(
    id: string,
    updatePlanSubscriptionDto: UpdatePlanSubscriptionDto,
  ): Promise<PlanSubscription> {
    const subscription = await this.findOne(id);

    Object.assign(subscription, updatePlanSubscriptionDto);
    if (updatePlanSubscriptionDto.patientId) {
      subscription.patient = { id: updatePlanSubscriptionDto.patientId } as any;
    }
    if (updatePlanSubscriptionDto.planId) {
      subscription.plan = { id: updatePlanSubscriptionDto.planId } as any;
    }
    if (updatePlanSubscriptionDto.companyId !== undefined) {
      subscription.company = updatePlanSubscriptionDto.companyId
        ? ({ id: updatePlanSubscriptionDto.companyId } as any)
        : null;
    }
    subscription.updatedAt = new Date();

    return this.planSubscriptionRepository.save(subscription);
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);

    await this.planSubscriptionRepository.remove(subscription);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<PlanSubscription>,
    filters: PlanSubscriptionFilters,
  ) {
    if (filters.patientId) {
      queryBuilder.andWhere('patient.id = :patientId', {
        patientId: filters.patientId,
      });
    }

    if (filters.planId) {
      queryBuilder.andWhere('plan.id = :planId', {
        planId: filters.planId,
      });
    }

    if (filters.companyId) {
      queryBuilder.andWhere('company.id = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('planSubscription.status IN (:...status)', {
        status: filters.status,
      });
    }

    if (filters.payerType && filters.payerType.length > 0) {
      queryBuilder.andWhere('planSubscription.payerType IN (:...payerType)', {
        payerType: filters.payerType,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<PlanSubscription>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const allowedFields = [
      'status',
      'payerType',
      'startDate',
      'endDate',
      'createdAt',
      'updatedAt',
    ];

    const column = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.addOrderBy(`planSubscription.${column}`, direction);
  }
}

type PlanSubscriptionFilters = Omit<
  QueryPlanSubscriptionsDto,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>;
