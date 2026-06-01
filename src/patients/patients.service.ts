import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient, PatientStatus } from './entities/patient.entity';
import { Company } from '../companies/entities/company.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { applyGlobalSearch } from '../common/query/apply-global-search';

const PATIENT_SORT_COLUMN_MAP: Record<string, string[]> = {
  createdAt: ['patient.createdAt'],
  updatedAt: ['patient.updatedAt'],
  firstName: ['patient.firstName'],
  lastName: ['patient.lastName'],
  documentNumber: ['patient.documentNumber'],
  status: ['patient.status'],
  fullName: ['patient.firstName', 'patient.lastName'],
};

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const patient = this.patientRepository.create(createPatientDto);

    if (createPatientDto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: createPatientDto.companyId },
      });

      if (!company) {
        throw new NotFoundException(
          `Company with ID ${createPatientDto.companyId} not found`,
        );
      }

      patient.company = company;
    }

    return this.patientRepository.save(patient);
  }

  async findAll(queryDto: QueryPatientsDto = {}): Promise<{
    data: Patient[];
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
      ...filters
    } = queryDto;

    const queryBuilder = this.patientRepository.createQueryBuilder('patient');

    // Aplicar filtros
    this.applyFilters(queryBuilder, filters);

    // Aplicar ordenamiento
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: {
        company: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async findByPhone(phone: string): Promise<Patient | null> {
    return this.patientRepository.findOne({
      where: { phone },
    });
  }

  async findByDocument(documentNumber: string): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: { documentNumber },
      relations: {
        company: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with document number ${documentNumber} not found`,
      );
    }

    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findOne(id);
    const { companyId, ...patientData } = updatePatientDto;

    // Update the patient with the new data
    Object.assign(patient, patientData);

    if (companyId !== undefined) {
      if (!companyId) {
        patient.company = null;
      } else {
        const company = await this.companyRepository.findOne({
          where: { id: companyId },
        });

        if (!company) {
          throw new NotFoundException(`Company with ID ${companyId} not found`);
        }

        patient.company = company;
      }
    }

    patient.updatedAt = new Date();

    return this.patientRepository.save(patient);
  }

  async updateStatus(id: string, status: PatientStatus): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.status = status;
    patient.updatedAt = new Date();
    return this.patientRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }

  async activatePatient(id: string): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.status = PatientStatus.ACTIVE;
    patient.updatedAt = new Date();
    return this.patientRepository.save(patient);
  }

  async deactivatePatient(id: string): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.status = PatientStatus.INACTIVE;
    patient.updatedAt = new Date();
    return this.patientRepository.save(patient);
  }

  async findActivePatients(): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { status: PatientStatus.ACTIVE },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
      },
    });
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Patient>,
    filters: Partial<QueryPatientsDto>,
  ): void {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: [
        'patient.firstName',
        'patient.lastName',
        "CONCAT(patient.firstName, ' ', patient.lastName)",
        'patient.documentNumber',
        'patient.phone',
      ],
      paramName: 'patientSearch',
    });

    if (filters.fullName) {
      const fullName = filters.fullName.trim().toLowerCase();

      queryBuilder.andWhere(
        `
      (
        LOWER(patient.firstName) LIKE :fullName
        OR LOWER(patient.lastName) LIKE :fullName
        OR LOWER(CONCAT(patient.firstName, ' ', patient.lastName)) LIKE :fullName
      )
    `,
        { fullName: `%${fullName}%` },
      );
    }

    if (filters.documentNumber) {
      const documentNumber = filters.documentNumber.trim().toLowerCase();

      queryBuilder.andWhere(
        `
      (
        LOWER(patient.documentNumber) LIKE :documentNumber
      )
    `,
        { documentNumber: `%${documentNumber}%` },
      );
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('patient.status IN (:...status)', {
        status: filters.status,
      });
    }
  }

  private applySorting(
    qb: SelectQueryBuilder<Patient>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const safeSortBy = sortBy || 'createdAt';
    const sortColumns = PATIENT_SORT_COLUMN_MAP[safeSortBy];

    if (!sortColumns) {
      throw new BadRequestException(
        `Invalid sortBy value. Allowed values: ${Object.keys(PATIENT_SORT_COLUMN_MAP).join(', ')}`,
      );
    }

    for (const sortColumn of sortColumns) {
      qb.addOrderBy(sortColumn, sortOrder);
    }
  }
}
