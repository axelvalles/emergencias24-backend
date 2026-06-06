import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { applyGlobalSearch } from '../../common/query/apply-global-search';
import { Benefit } from '../../benefits/entities/benefit.entity';
import {
  CreatePlanBenefitDto,
  CreatePlanDto,
} from '../dto/create-plan.dto';
import { QueryPlansDto } from '../dto/query-plans.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { Plan, PlanStatus } from '../entities/plan.entity';
import {
  PlanBenefit,
  PlanBenefitValueType,
} from '../entities/plan-benefit.entity';
import {
  PlanSubscription,
  PlanSubscriptionStatus,
} from '../entities/plan-subscription.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Benefit)
    private readonly benefitRepository: Repository<Benefit>,
    @InjectRepository(PlanBenefit)
    private readonly planBenefitRepository: Repository<PlanBenefit>,
    @InjectRepository(PlanSubscription)
    private readonly planSubscriptionRepository: Repository<PlanSubscription>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const { planBenefits, ...planData } = createPlanDto;

    await this.validatePlanBenefits(planBenefits);

    const plan = this.planRepository.create(planData);
    const savedPlan = await this.planRepository.save(plan);

    await this.syncPlanBenefits(savedPlan.id, planBenefits);

    return this.findOne(savedPlan.id);
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
    queryBuilder.loadRelationCountAndMap(
      'plan.benefitsCount',
      'plan.planBenefits',
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
      .leftJoinAndSelect('plan.planBenefits', 'planBenefit')
      .leftJoinAndSelect('planBenefit.benefit', 'benefit')
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
      .loadRelationCountAndMap('plan.benefitsCount', 'plan.planBenefits')
      .orderBy('benefit.name', 'ASC')
      .getOne();

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    await this.findOne(id);
    const plan = await this.findOneForPersistence(id);
    const { planBenefits, ...planData } = updatePlanDto;

    if (planBenefits !== undefined) {
      await this.validatePlanBenefits(planBenefits);
      await this.syncPlanBenefits(id, planBenefits);
    }

    Object.assign(plan, planData);
    plan.updatedAt = new Date();

    await this.planRepository.save(plan);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOneForPersistence(id);

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
    const plan = await this.findOneForPersistence(id);
    plan.status = PlanStatus.INACTIVE;
    plan.updatedAt = new Date();
    return this.planRepository.save(plan);
  }

  async activate(id: string): Promise<Plan> {
    const plan = await this.findOneForPersistence(id);
    plan.status = PlanStatus.ACTIVE;
    plan.updatedAt = new Date();
    return this.planRepository.save(plan);
  }

  private async findOneForPersistence(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Plan>,
    filters: PlanFilters,
  ) {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: ['plan.name', 'plan.description', 'plan.benefitsNotes'],
      paramName: 'planSearch',
    });

    if (filters.name) {
      const name = filters.name.trim().toLowerCase();

      queryBuilder.andWhere('(LOWER(plan.name) LIKE :name)', {
        name: `%${name}%`,
      });
    }

    if (filters.description) {
      const description = filters.description.trim().toLowerCase();

      queryBuilder.andWhere('(LOWER(plan.description) LIKE :description)', {
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

    if (filters.billingPeriod && filters.billingPeriod.length > 0) {
      queryBuilder.andWhere('plan.billingPeriod IN (:...billingPeriod)', {
        billingPeriod: filters.billingPeriod,
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
      'billingPeriod',
      'status',
      'monthlyCost',
      'createdAt',
      'updatedAt',
    ];

    const column = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.addOrderBy(`plan.${column}`, direction);
  }

  private async validatePlanBenefits(planBenefits: CreatePlanBenefitDto[]) {
    const benefitIds = planBenefits.map((planBenefit) => planBenefit.benefitId);

    if (new Set(benefitIds).size !== benefitIds.length) {
      throw new BadRequestException(
        'No se puede repetir el mismo beneficio dentro de un plan',
      );
    }

    const benefits = await this.benefitRepository.findBy({
      id: In(benefitIds),
    });

    if (benefits.length !== benefitIds.length) {
      throw new BadRequestException('Uno o más beneficios enviados no existen');
    }

    for (const planBenefit of planBenefits) {
      if (
        planBenefit.valueType === PlanBenefitValueType.QUANTITY &&
        !planBenefit.isUnlimited &&
        typeof planBenefit.quantity !== 'number'
      ) {
        throw new BadRequestException(
          'Los beneficios por cantidad requieren una cantidad o marcarse como ilimitados',
        );
      }

      if (
        planBenefit.valueType === PlanBenefitValueType.DISCOUNT &&
        !planBenefit.discountPercentage
      ) {
        throw new BadRequestException(
          'Los beneficios por descuento requieren un porcentaje',
        );
      }
    }
  }

  private async syncPlanBenefits(
    planId: string,
    planBenefits: CreatePlanBenefitDto[],
  ) {
    await this.planBenefitRepository.delete({ planId });

    if (planBenefits.length === 0) {
      return;
    }

    const planBenefitEntities = planBenefits.map((planBenefit) =>
      this.planBenefitRepository.create({
        planId,
        benefitId: planBenefit.benefitId,
        valueType: planBenefit.valueType,
        quantity:
          planBenefit.valueType === PlanBenefitValueType.QUANTITY &&
          !planBenefit.isUnlimited
            ? planBenefit.quantity ?? null
            : null,
        isUnlimited:
          planBenefit.valueType === PlanBenefitValueType.QUANTITY
            ? planBenefit.isUnlimited
            : false,
        discountPercentage:
          planBenefit.valueType === PlanBenefitValueType.DISCOUNT
            ? planBenefit.discountPercentage ?? null
            : null,
      }),
    );

    await this.planBenefitRepository.save(planBenefitEntities);
  }
}

type PlanFilters = Omit<
  QueryPlansDto,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>;
