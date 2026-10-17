import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { applyGlobalSearch } from '../common/query/apply-global-search';
import { Patient } from '../patients/entities/patient.entity';
import { CreateIndividualPayerDto } from './dto/create-individual-payer.dto';
import { QueryIndividualPayersDto } from './dto/query-individual-payers.dto';
import { UpdateIndividualPayerDto } from './dto/update-individual-payer.dto';
import { IndividualPayer } from './entities/individual-payer.entity';

@Injectable()
export class IndividualPayersService {
  constructor(
    @InjectRepository(IndividualPayer)
    private readonly individualPayerRepository: Repository<IndividualPayer>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(dto: CreateIndividualPayerDto) {
    const documentNumber = dto.documentNumber.trim();
    await this.ensureUniqueDocument(documentNumber);

    const linkedPatient = dto.linkedPatientId
      ? await this.resolveLinkedPatient(
          dto.linkedPatientId,
          dto.documentType,
          documentNumber,
        )
      : null;

    const payer = this.individualPayerRepository.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      documentType: dto.documentType,
      documentNumber,
      phone: this.normalizeOptional(dto.phone),
      email: this.normalizeOptional(dto.email)?.toLowerCase() ?? null,
      address: this.normalizeOptional(dto.address),
      city: this.normalizeOptional(dto.city),
      linkedPatient,
    });

    return this.toResponse(await this.savePayer(payer));
  }

  async findAll(queryDto: QueryIndividualPayersDto = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...filters
    } = queryDto;
    const currentPage = Math.max(1, page);
    const sanitizedLimit = Math.min(Math.max(1, limit), 100);
    const queryBuilder = this.individualPayerRepository
      .createQueryBuilder('individualPayer')
      .leftJoinAndSelect('individualPayer.linkedPatient', 'linkedPatient');

    this.applyFilters(queryBuilder, filters);
    this.applySorting(queryBuilder, sortBy, sortOrder);
    queryBuilder.skip((currentPage - 1) * sanitizedLimit).take(sanitizedLimit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((payer) => this.toResponse(payer)),
      total,
      page: currentPage,
      limit: sanitizedLimit,
      totalPages: Math.ceil(total / sanitizedLimit),
    };
  }

  async findOne(id: string) {
    return this.toResponse(await this.findEntity(id));
  }

  private async findEntity(id: string): Promise<IndividualPayer> {
    const payer = await this.individualPayerRepository.findOne({
      where: { id },
      relations: ['linkedPatient'],
    });

    if (!payer) {
      throw new NotFoundException(`Individual payer with ID ${id} not found`);
    }

    return payer;
  }

  async update(id: string, dto: UpdateIndividualPayerDto) {
    const payer = await this.findEntity(id);

    if (dto.documentNumber !== undefined) {
      const documentNumber = dto.documentNumber.trim();
      if (documentNumber !== payer.documentNumber) {
        await this.ensureUniqueDocument(documentNumber, id);
      }
      payer.documentNumber = documentNumber;
    }

    if (dto.firstName !== undefined) payer.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) payer.lastName = dto.lastName.trim();
    if (dto.documentType !== undefined) payer.documentType = dto.documentType;
    if (dto.phone !== undefined)
      payer.phone = this.normalizeOptional(dto.phone);
    if (dto.email !== undefined) {
      payer.email = this.normalizeOptional(dto.email)?.toLowerCase() ?? null;
    }
    if (dto.address !== undefined) {
      payer.address = this.normalizeOptional(dto.address);
    }
    if (dto.city !== undefined) payer.city = this.normalizeOptional(dto.city);

    if (dto.linkedPatientId !== undefined) {
      payer.linkedPatient = dto.linkedPatientId
        ? await this.resolveLinkedPatient(
            dto.linkedPatientId,
            payer.documentType,
            payer.documentNumber,
            id,
          )
        : null;
    } else if (
      payer.linkedPatient &&
      (dto.documentType !== undefined || dto.documentNumber !== undefined)
    ) {
      payer.linkedPatient = await this.resolveLinkedPatient(
        payer.linkedPatient.id,
        payer.documentType,
        payer.documentNumber,
        id,
      );
    }

    return this.toResponse(await this.savePayer(payer));
  }

  async remove(id: string): Promise<void> {
    const payer = await this.findEntity(id);
    await this.individualPayerRepository.remove(payer);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<IndividualPayer>,
    filters: Omit<
      QueryIndividualPayersDto,
      'page' | 'limit' | 'sortBy' | 'sortOrder'
    >,
  ) {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: [
        'individualPayer.firstName',
        'individualPayer.lastName',
        "CONCAT(individualPayer.firstName, ' ', individualPayer.lastName)",
        'individualPayer.documentNumber',
        'individualPayer.phone',
        'individualPayer.email',
      ],
      paramName: 'individualPayerSearch',
    });

    if (filters.documentNumber?.trim()) {
      queryBuilder.andWhere(
        'LOWER(individualPayer.documentNumber) LIKE :documentNumber',
        {
          documentNumber: `%${filters.documentNumber.trim().toLowerCase()}%`,
        },
      );
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<IndividualPayer>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const allowedFields = [
      'firstName',
      'lastName',
      'documentNumber',
      'createdAt',
      'updatedAt',
    ];
    const column = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.addOrderBy(
      `individualPayer.${column}`,
      sortOrder === 'ASC' ? 'ASC' : 'DESC',
    );
  }

  private async ensureUniqueDocument(
    documentNumber: string,
    currentId?: string,
  ) {
    const existing = await this.individualPayerRepository.findOne({
      where: { documentNumber },
    });

    if (existing && existing.id !== currentId) {
      throw new ConflictException(
        'An individual payer with this document number already exists',
      );
    }
  }

  private async resolveLinkedPatient(
    patientId: string,
    documentType: Patient['documentType'],
    documentNumber: string,
    currentPayerId?: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (
      patient.documentType !== documentType ||
      patient.documentNumber.trim() !== documentNumber.trim()
    ) {
      throw new ConflictException(
        'Payer document type and number must match the linked patient',
      );
    }

    const existingLink = await this.individualPayerRepository.findOne({
      where: { linkedPatient: { id: patientId } },
    });

    if (existingLink && existingLink.id !== currentPayerId) {
      throw new ConflictException(
        'This patient is already linked to another individual payer',
      );
    }

    return patient;
  }

  private normalizeOptional(value?: string): string | null {
    const normalized = value?.trim();
    return normalized || null;
  }

  private async savePayer(payer: IndividualPayer): Promise<IndividualPayer> {
    try {
      return await this.individualPayerRepository.save(payer);
    } catch (error: unknown) {
      if (this.isDocumentNumberUniqueViolation(error)) {
        throw new ConflictException(
          'An individual payer with this document number already exists',
        );
      }

      throw error;
    }
  }

  private isDocumentNumberUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const outerError = error as Record<string, unknown>;
    const driverError =
      outerError.driverError && typeof outerError.driverError === 'object'
        ? (outerError.driverError as Record<string, unknown>)
        : outerError;

    return (
      driverError.code === '23505' &&
      driverError.constraint === 'IDX_INDIVIDUAL_PAYERS_DOCUMENT_NUMBER'
    );
  }

  private toResponse(payer: IndividualPayer) {
    const { linkedPatient, ...payerData } = payer;

    return {
      ...payerData,
      fullName: `${payer.firstName} ${payer.lastName}`,
      linkedPatient: linkedPatient
        ? {
            id: linkedPatient.id,
            firstName: linkedPatient.firstName,
            lastName: linkedPatient.lastName,
            fullName: `${linkedPatient.firstName} ${linkedPatient.lastName}`,
          }
        : null,
    };
  }
}
