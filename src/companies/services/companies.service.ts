import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Company, CompanyStatus } from '../entities/company.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { QueryCompaniesDto } from '../dto/query-companies.dto';
import { applyGlobalSearch } from '../../common/query/apply-global-search';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  async findWithPagination(queryDto: QueryCompaniesDto = {}): Promise<{
    data: Company[];
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

    const queryBuilder = this.companyRepository.createQueryBuilder('company');
    queryBuilder.loadRelationCountAndMap(
      'company.associatedPatientsCount',
      'company.patients',
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

  async findAll() {
    return await this.companyRepository.find();
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.companyRepository.findAndCount({
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

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(id);

    Object.assign(company, updateCompanyDto);
    company.updatedAt = new Date();

    return this.companyRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);

    const associatedPatientsCount = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.company_id = :companyId', { companyId: id })
      .getCount();

    if (associatedPatientsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar la empresa porque tiene pacientes asociados',
      );
    }

    await this.companyRepository.remove(company);
  }

  async deactivate(id: string): Promise<Company> {
    const company = await this.findOne(id);
    company.status = CompanyStatus.INACTIVE;
    company.updatedAt = new Date();
    return this.companyRepository.save(company);
  }

  async activate(id: string): Promise<Company> {
    const company = await this.findOne(id);
    company.status = CompanyStatus.ACTIVE;
    company.updatedAt = new Date();
    return this.companyRepository.save(company);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Company>,
    filters: CompanyFilters,
  ) {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: [
        'company.name',
        'company.taxId',
        'company.contactEmail',
        'company.contactPhone',
      ],
      paramName: 'companySearch',
    });

    if (filters.name) {
      const name = filters.name.trim().toLowerCase();

      queryBuilder.andWhere(`(LOWER(company.name) LIKE :name)`, {
        name: `%${name}%`,
      });
    }

    if (filters.taxId) {
      const taxId = filters.taxId.trim().toLowerCase();

      queryBuilder.andWhere(`(LOWER(company.taxId) LIKE :taxId)`, {
        taxId: `%${taxId}%`,
      });
    }

    if (filters.contactEmail) {
      const contactEmail = filters.contactEmail.trim().toLowerCase();

      queryBuilder.andWhere(
        `(LOWER(company.contactEmail) LIKE :contactEmail)`,
        { contactEmail: `%${contactEmail}%` },
      );
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('company.status IN (:...status)', {
        status: filters.status,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Company>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const allowedFields = [
      'name',
      'taxId',
      'contactEmail',
      'contactPhone',
      'status',
      'createdAt',
      'updatedAt',
    ];

    const column = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.addOrderBy(`company.${column}`, direction);
  }
}

type CompanyFilters = Omit<
  QueryCompaniesDto,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>;
