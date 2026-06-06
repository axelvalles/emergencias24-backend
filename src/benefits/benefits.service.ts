import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { applyGlobalSearch } from '../common/query/apply-global-search';
import { PlanBenefit } from '../plans/entities/plan-benefit.entity';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { QueryBenefitsDto } from './dto/query-benefits.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { Benefit } from './entities/benefit.entity';

@Injectable()
export class BenefitsService {
  constructor(
    @InjectRepository(Benefit)
    private readonly benefitRepository: Repository<Benefit>,
    @InjectRepository(PlanBenefit)
    private readonly planBenefitRepository: Repository<PlanBenefit>,
  ) {}

  async create(createBenefitDto: CreateBenefitDto): Promise<Benefit> {
    const normalizedName = createBenefitDto.name.trim();
    await this.ensureUniqueName(normalizedName);

    const benefit = this.benefitRepository.create({ name: normalizedName });

    return this.benefitRepository.save(benefit);
  }

  async findAll(queryDto: QueryBenefitsDto = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'ASC',
      ...filters
    } = queryDto;

    const currentPage = Math.max(1, page);
    const sanitizedLimit = Math.min(Math.max(1, limit), 100);

    const queryBuilder = this.benefitRepository.createQueryBuilder('benefit');
    queryBuilder.loadRelationCountAndMap(
      'benefit.plansCount',
      'benefit.planBenefits',
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

  async findOne(id: string): Promise<Benefit> {
    const benefit = await this.benefitRepository
      .createQueryBuilder('benefit')
      .where('benefit.id = :id', { id })
      .loadRelationCountAndMap('benefit.plansCount', 'benefit.planBenefits')
      .getOne();

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${id} not found`);
    }

    return benefit;
  }

  async update(id: string, updateBenefitDto: UpdateBenefitDto): Promise<Benefit> {
    const benefit = await this.findOne(id);

    if (updateBenefitDto.name !== undefined) {
      const normalizedName = updateBenefitDto.name.trim();
      await this.ensureUniqueName(normalizedName, id);
      benefit.name = normalizedName;
    }

    benefit.updatedAt = new Date();

    return this.benefitRepository.save(benefit);
  }

  async remove(id: string): Promise<void> {
    const benefit = await this.findOne(id);

    const relatedPlansCount = await this.planBenefitRepository.count({
      where: { benefit: { id } },
    });

    if (relatedPlansCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el beneficio porque está asociado a uno o más planes',
      );
    }

    await this.benefitRepository.remove(benefit);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Benefit>,
    filters: BenefitFilters,
  ) {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: ['benefit.name'],
      paramName: 'benefitSearch',
    });

    if (filters.name) {
      queryBuilder.andWhere('LOWER(benefit.name) LIKE :name', {
        name: `%${filters.name.trim().toLowerCase()}%`,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Benefit>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const allowedFields = ['name', 'createdAt', 'updatedAt'];
    const column = allowedFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.addOrderBy(
      `benefit.${column}`,
      sortOrder === 'DESC' ? 'DESC' : 'ASC',
    );
  }

  private async ensureUniqueName(name: string, currentId?: string) {
    const existingBenefit = await this.benefitRepository
      .createQueryBuilder('benefit')
      .where('LOWER(benefit.name) = LOWER(:name)', { name })
      .getOne();

    if (existingBenefit && existingBenefit.id !== currentId) {
      throw new BadRequestException('Ya existe un beneficio con ese nombre');
    }
  }
}

type BenefitFilters = Omit<
  QueryBenefitsDto,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>;
