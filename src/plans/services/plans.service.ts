import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Plan, PlanStatus } from '../entities/plan.entity';
import {
  PlanSubscription,
  PlanSubscriptionStatus,
} from '../entities/plan-subscription.entity';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { QueryPlansDto } from '../dto/query-plans.dto';
import { applyGlobalSearch } from '../../common/query/apply-global-search';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(PlanSubscription)
    private readonly planSubscriptionRepository: Repository<PlanSubscription>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create({
      ...createPlanDto,
      benefits: createPlanDto.benefits ?? {},
    });
    return this.planRepository.save(plan);
  }

  async findAll(queryDto: QueryPlansDto = {}): Promise<{
    data: Plan[];
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
    const filters = rawFilters;

    const queryBuilder = this.planRepository.createQueryBuilder('plan');
    queryBuilder.loadRelationCountAndMap(
      'plan.activeSubscriptionsCount',
      'plan.subscriptions',
      'subscription',
      (qb) =>
        qb.andWhere('subscription.status IN (:...activeStatuses)', {
          activeStatuses: [
            PlanSubscriptionStatus.ACTIVE,
            PlanSubscriptionStatus.SUSPENDED,
          ],
        }),
    );

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

  async findAllActive() {
    return this.planRepository.find({
      where: { status: PlanStatus.ACTIVE },
    });
  }

  async findAllActivePaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.planRepository.findAndCount({
      where: { status: PlanStatus.ACTIVE },
      skip,
      take: limit,
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository
      .createQueryBuilder('plan')
      .where('plan.id = :id', { id })
      .loadRelationCountAndMap(
        'plan.activeSubscriptionsCount',
        'plan.subscriptions',
        'subscription',
        (qb) =>
          qb.andWhere('subscription.status IN (:...activeStatuses)', {
            activeStatuses: [
              PlanSubscriptionStatus.ACTIVE,
              PlanSubscriptionStatus.SUSPENDED,
            ],
          }),
      )
      .getOne();

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    Object.assign(plan, updatePlanDto);
    plan.updatedAt = new Date();

    return this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);

    const activeOrSuspendedSubscriptions = await this.planSubscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.plan_id = :planId', { planId: id })
      .andWhere('subscription.status IN (:...statuses)', {
        statuses: [
          PlanSubscriptionStatus.ACTIVE,
          PlanSubscriptionStatus.SUSPENDED,
        ],
      })
      .getCount();

    if (activeOrSuspendedSubscriptions > 0) {
      throw new BadRequestException(
        'No se puede eliminar el plan porque tiene suscripciones activas o suspendidas asociadas',
      );
    }

    await this.planRepository.remove(plan);
  }

  async deactivate(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.status = PlanStatus.INACTIVE;
    plan.updatedAt = new Date();
    return this.planRepository.save(plan);
  }

  async activate(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.status = PlanStatus.ACTIVE;
    plan.updatedAt = new Date();
    return this.planRepository.save(plan);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Plan>,
    filters: PlanFilters,
  ) {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: ['plan.name', 'plan.description'],
      paramName: 'planSearch',
    });

    if (filters.name) {
      const name = filters.name.trim().toLowerCase();

      queryBuilder.andWhere(`(LOWER(plan.name) LIKE :name)`, {
        name: `%${name}%`,
      });
    }

    if (filters.description) {
      const description = filters.description.trim().toLowerCase();

      queryBuilder.andWhere(`(LOWER(plan.description) LIKE :description)`, {
        description: `%${description}%`,
      });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('plan.status IN (:...status)', {
        status: filters.status,
      });
    }

    if (filters.planType && filters.planType.length > 0) {
      queryBuilder.andWhere('plan.planType IN (:...planType)', {
        planType: filters.planType,
      });
    }

    if (typeof filters.monthlyCostMin === 'number') {
      queryBuilder.andWhere('plan.monthlyCost >= :monthlyCostMin', {
        monthlyCostMin: filters.monthlyCostMin,
      });
    }

    if (typeof filters.monthlyCostMax === 'number') {
      queryBuilder.andWhere('plan.monthlyCost <= :monthlyCostMax', {
        monthlyCostMax: filters.monthlyCostMax,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Plan>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const allowedFields = [
      'name',
      'description',
      'planType',
      'status',
      'monthlyCost',
      'createdAt',
      'updatedAt',
    ];

    const column = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.addOrderBy(`plan.${column}`, direction);
  }
}

type PlanFilters = Omit<
  QueryPlansDto,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>;
