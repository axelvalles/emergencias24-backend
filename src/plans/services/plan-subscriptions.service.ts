import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import {
  PlanSubscription,
  PlanSubscriptionStatus,
} from '../entities/plan-subscription.entity';
import { CreatePlanSubscriptionDto } from '../dto/create-plan-subscription.dto';
import { UpdatePlanSubscriptionDto } from '../dto/update-plan-subscription.dto';
import { QueryPlanSubscriptionsDto } from '../dto/query-plan-subscriptions.dto';
import { AssignFamilyMemberDto } from '../dto/assign-family-member.dto';
import {
  ValidateFamilyMemberDto,
  ValidateFamilyMemberResponse,
} from '../dto/validate-family-member.dto';
import { Plan, PlanType } from '../entities/plan.entity';
import { Patient } from '../../patients/entities/patient.entity';
import {
  FamilyMemberAssignmentException,
  FamilyMemberAssignmentErrorCode,
} from '../exceptions/family-member-assignment.exception';
import {
  PlanSubscriptionCreationErrorCode,
  PlanSubscriptionCreationException,
} from '../exceptions/plan-subscription-creation.exception';
import {
  PlanSubscriptionUpdateErrorCode,
  PlanSubscriptionUpdateException,
} from '../exceptions/plan-subscription-update.exception';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    @InjectRepository(PlanSubscription)
    private readonly planSubscriptionRepository: Repository<PlanSubscription>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(dto: CreatePlanSubscriptionDto): Promise<PlanSubscription> {
    // 1. Load plan (we need planType)
    const plan = await this.planRepository.findOne({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    // 2. Validate patient does NOT already have this exact plan
    const existingSamePlan = await this.planSubscriptionRepository.findOne({
      where: {
        patient: { id: dto.patientId },
        plan: { id: dto.planId },
        status: In([
          PlanSubscriptionStatus.ACTIVE,
          PlanSubscriptionStatus.SUSPENDED,
        ]),
      },
    });

    if (existingSamePlan) {
      throw new PlanSubscriptionCreationException(
        'Patient already has this plan assigned',
        PlanSubscriptionCreationErrorCode.PLAN_ALREADY_ASSIGNED,
      );
    }

    // 3. If plan is FAMILY → validate only one family plan allowed
    if (plan.planType === PlanType.FAMILY) {
      const existingFamilyPlan = await this.planSubscriptionRepository.findOne({
        where: {
          patient: { id: dto.patientId },
          status: In([
            PlanSubscriptionStatus.ACTIVE,
            PlanSubscriptionStatus.SUSPENDED,
          ]),
          plan: { planType: PlanType.FAMILY },
        },
        relations: ['plan'],
      });

      if (existingFamilyPlan) {
        throw new PlanSubscriptionCreationException(
          'Patient already has an active family plan',
          PlanSubscriptionCreationErrorCode.PATIENT_ALREADY_HAS_FAMILY_PLAN,
        );
      }
    }

    // 4. Create subscription
    const subscription = this.planSubscriptionRepository.create({
      patient: { id: dto.patientId },
      plan: { id: dto.planId },
      company: dto.companyId ? { id: dto.companyId } : null,
      payerType: dto.payerType,
      status: dto.status ?? PlanSubscriptionStatus.ACTIVE,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
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
    updateDto: UpdatePlanSubscriptionDto,
  ): Promise<PlanSubscription> {
    const subscription = await this.planSubscriptionRepository.findOne({
      where: { id },
      relations: ['patient', 'plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    /**
     * 1️⃣ No permitir cambiar paciente
     */
    if (
      updateDto.patientId &&
      updateDto.patientId !== subscription.patient.id
    ) {
      throw new PlanSubscriptionUpdateException(
        'Changing patient of a subscription is not allowed',
        PlanSubscriptionUpdateErrorCode.PATIENT_CHANGE_NOT_ALLOWED,
      );
    }

    /**
     * 2️⃣ No permitir cambiar plan
     */
    if (updateDto.planId && updateDto.planId !== subscription.plan.id) {
      throw new PlanSubscriptionUpdateException(
        'Changing plan of a subscription is not allowed',
        PlanSubscriptionUpdateErrorCode.PLAN_CHANGE_NOT_ALLOWED,
      );
    }

    /**
     * 3️⃣ Validar transición de estado
     */
    if (updateDto.status) {
      const currentStatus = subscription.status;
      const nextStatus = updateDto.status;

      // CANCELED es estado terminal
      if (
        currentStatus === PlanSubscriptionStatus.CANCELED &&
        nextStatus !== PlanSubscriptionStatus.CANCELED
      ) {
        throw new PlanSubscriptionUpdateException(
          'Canceled subscriptions cannot change status',
          PlanSubscriptionUpdateErrorCode.INVALID_STATUS_TRANSITION,
        );
      }

      // Reactivación controlada
      if (
        currentStatus !== PlanSubscriptionStatus.ACTIVE &&
        nextStatus === PlanSubscriptionStatus.ACTIVE
      ) {
        // Validar reglas al reactivar
        await this.validateActivationRules(subscription);
      }

      subscription.status = nextStatus;
    }

    /**
     * 4️⃣ Validar fechas
     */
    if (updateDto.startDate) {
      const startDate = new Date(updateDto.startDate);

      if (subscription.endDate && startDate > subscription.endDate) {
        throw new PlanSubscriptionUpdateException(
          'Start date cannot be after end date',
          PlanSubscriptionUpdateErrorCode.INVALID_DATE_RANGE,
        );
      }

      subscription.startDate = startDate;
    }

    if (updateDto.endDate) {
      const endDate = new Date(updateDto.endDate);

      if (endDate < subscription.startDate) {
        throw new PlanSubscriptionUpdateException(
          'End date cannot be before start date',
          PlanSubscriptionUpdateErrorCode.INVALID_DATE_RANGE,
        );
      }

      subscription.endDate = endDate;
    }

    /**
     * 5️⃣ Empresa (sí se puede cambiar)
     */
    if (updateDto.companyId !== undefined) {
      subscription.company = updateDto.companyId
        ? ({ id: updateDto.companyId } as any)
        : null;
    }

    subscription.updatedAt = new Date();

    return this.planSubscriptionRepository.save(subscription);
  }

  private async validateActivationRules(
    subscription: PlanSubscription,
  ): Promise<void> {
    // Regla: no duplicar el mismo plan
    const existingPlan = await this.planSubscriptionRepository.findOne({
      where: {
        id: Not(subscription.id),
        patient: { id: subscription.patient.id },
        plan: { id: subscription.plan.id },
        status: PlanSubscriptionStatus.ACTIVE,
      },
    });

    if (existingPlan) {
      throw new PlanSubscriptionUpdateException(
        'Patient already has this plan active',
        PlanSubscriptionUpdateErrorCode.PLAN_ALREADY_ASSIGNED,
      );
    }

    // Regla: solo un plan familiar activo
    if (subscription.plan.planType === PlanType.FAMILY) {
      const existingFamilyPlan = await this.planSubscriptionRepository.findOne({
        where: {
          id: Not(subscription.id),
          patient: { id: subscription.patient.id },
          status: PlanSubscriptionStatus.ACTIVE,
          plan: { planType: PlanType.FAMILY },
        },
      });

      if (existingFamilyPlan) {
        throw new PlanSubscriptionUpdateException(
          'Patient already has an active family plan',
          PlanSubscriptionUpdateErrorCode.PATIENT_ALREADY_HAS_FAMILY_PLAN,
        );
      }
    }
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);

    await this.planSubscriptionRepository.remove(subscription);
  }

  async assignFamilyMember(
    dto: AssignFamilyMemberDto,
  ): Promise<PlanSubscription> {
    // 1. Find the main subscription
    const mainSubscription = await this.planSubscriptionRepository.findOne({
      where: { id: dto.subscriptionId },
      relations: ['patient', 'plan', 'company', 'payerPatient'],
    });

    if (!mainSubscription) {
      throw new FamilyMemberAssignmentException(
        `Subscription with ID ${dto.subscriptionId} not found`,
        FamilyMemberAssignmentErrorCode.SUBSCRIPTION_NOT_FOUND,
      );
    }

    // 2. Validate ACTIVE
    if (mainSubscription.status !== PlanSubscriptionStatus.ACTIVE) {
      throw new FamilyMemberAssignmentException(
        `Subscription must be ACTIVE`,
        FamilyMemberAssignmentErrorCode.SUBSCRIPTION_NOT_ACTIVE,
      );
    }

    // 3. Validate FAMILY plan
    if (mainSubscription.plan.planType !== PlanType.FAMILY) {
      throw new FamilyMemberAssignmentException(
        `Only FAMILY plans support family members`,
        FamilyMemberAssignmentErrorCode.PLAN_NOT_FAMILY_TYPE,
      );
    }

    // 4. Resolve main subscriber
    const payerPatient =
      mainSubscription.payerPatient || mainSubscription.patient;

    // 5. Load family member
    const familyMemberPatient = await this.patientRepository.findOne({
      where: { documentNumber: dto.familyMemberDocumentNumber },
    });

    if (!familyMemberPatient) {
      throw new FamilyMemberAssignmentException(
        `Patient with document number ${dto.familyMemberDocumentNumber} not found`,
        FamilyMemberAssignmentErrorCode.FAMILY_MEMBER_PATIENT_NOT_FOUND,
      );
    }

    // 6. ❗ Validate patient has NO other active/suspended FAMILY plans
    const hasOtherFamilyPlan = await this.planSubscriptionRepository.findOne({
      where: {
        patient: { id: familyMemberPatient.id },
        status: In([
          PlanSubscriptionStatus.ACTIVE,
          PlanSubscriptionStatus.SUSPENDED,
        ]),
        plan: { planType: PlanType.FAMILY },
      },
      relations: ['plan'],
    });

    if (hasOtherFamilyPlan) {
      throw new FamilyMemberAssignmentException(
        'Patient already has an active family plan',
        FamilyMemberAssignmentErrorCode.FAMILY_MEMBER_HAS_ACTIVE_FAMILY_PLAN,
      );
    }

    // 7. Validate not main subscriber
    if (familyMemberPatient.id === payerPatient.id) {
      throw new FamilyMemberAssignmentException(
        'The family member cannot be the main subscriber',
        FamilyMemberAssignmentErrorCode.FAMILY_MEMBER_IS_MAIN_SUBSCRIBER,
      );
    }

    // 8. Validate not already assigned to THIS plan
    const existingFamilyMemberSubscription =
      await this.planSubscriptionRepository.findOne({
        where: {
          patient: { id: familyMemberPatient.id },
          plan: { id: mainSubscription.plan.id },
          payerPatient: { id: payerPatient.id },
          status: In([
            PlanSubscriptionStatus.ACTIVE,
            PlanSubscriptionStatus.SUSPENDED,
          ]),
        },
      });

    if (existingFamilyMemberSubscription) {
      throw new FamilyMemberAssignmentException(
        'Patient is already assigned to this family plan',
        FamilyMemberAssignmentErrorCode.FAMILY_MEMBER_ALREADY_ASSIGNED,
      );
    }

    // 9. Create subscription
    const familyMemberSubscription = this.planSubscriptionRepository.create({
      patient: familyMemberPatient,
      plan: mainSubscription.plan,
      company: mainSubscription.company,
      payerPatient,
      payerType: mainSubscription.payerType,
      status: PlanSubscriptionStatus.ACTIVE,
      startDate: mainSubscription.startDate,
      endDate: mainSubscription.endDate,
    });

    return this.planSubscriptionRepository.save(familyMemberSubscription);
  }

  /**
   * Gets all family members assigned to a family plan subscription.
   */
  async getFamilyMembers(subscriptionId: string): Promise<PlanSubscription[]> {
    const mainSubscription = await this.planSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['patient', 'plan'],
    });

    if (!mainSubscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    // Determine the payer patient
    const payerPatientId =
      mainSubscription.payerPatient?.id || mainSubscription.patient.id;

    // Find all subscriptions where payerPatient matches
    const familyMembers = await this.planSubscriptionRepository.find({
      where: {
        payerPatient: { id: payerPatientId },
        plan: { id: mainSubscription.plan.id },
      },
      relations: ['patient', 'plan', 'payerPatient'],
    });

    return familyMembers;
  }

  /**
   * Removes a family member from a family plan.
   */
  async removeFamilyMember(familyMemberSubscriptionId: string): Promise<void> {
    const subscription = await this.planSubscriptionRepository.findOne({
      where: { id: familyMemberSubscriptionId },
      relations: ['payerPatient'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${familyMemberSubscriptionId} not found`,
      );
    }

    // Validate this is a family member subscription (has payerPatient)
    if (!subscription.payerPatient) {
      throw new FamilyMemberAssignmentException(
        'This subscription is not a family member subscription. Use the regular remove endpoint instead.',
        FamilyMemberAssignmentErrorCode.FAMILY_MEMBER_PATIENT_NOT_FOUND, // reusing this code as it's similar
      );
    }

    await this.planSubscriptionRepository.remove(subscription);
  }

  /**
   * Finds all active plan subscriptions for a given patient.
   */
  async findActiveByPatientId(patientId: string): Promise<PlanSubscription[]> {
    return this.planSubscriptionRepository.find({
      where: {
        patient: { id: patientId },
        status: PlanSubscriptionStatus.ACTIVE,
      },
      relations: ['plan', 'company'],
    });
  }

  /**
   * Validates if a person (by document number) is eligible to be a family member.
   * Checks if they are not already part of any family plan as head or member.
   */
  async validateFamilyMemberEligibility(
    dto: ValidateFamilyMemberDto,
  ): Promise<ValidateFamilyMemberResponse> {
    // Find the patient by document number
    const patient = await this.patientRepository.findOne({
      where: { documentNumber: dto.documentNumber },
    });

    if (!patient) {
      return {
        isEligible: false,
        reason: 'Patient not found with the provided document number',
      };
    }

    // Find all active family plan subscriptions where this patient is involved
    const subscriptions = await this.planSubscriptionRepository.find({
      where: [
        // As main subscriber (no payerPatient)
        {
          patient: { id: patient.id },
          plan: { planType: PlanType.FAMILY },
          status: PlanSubscriptionStatus.ACTIVE,
        },
        // As family member (has payerPatient)
        {
          payerPatient: { id: patient.id },
          plan: { planType: PlanType.FAMILY },
          status: PlanSubscriptionStatus.ACTIVE,
        },
      ],
      relations: ['patient', 'plan', 'payerPatient'],
    });

    if (subscriptions.length === 0) {
      // No existing family plan subscriptions, eligible
      return {
        isEligible: true,
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          documentNumber: patient.documentNumber,
          documentType: patient.documentType,
        },
      };
    }

    // Has existing subscriptions, not eligible
    const existingSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      planName: sub.plan.name,
      role: sub.payerPatient ? 'member' : 'head',
      status: sub.status as string,
    }));

    return {
      isEligible: false,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentNumber: patient.documentNumber,
        documentType: patient.documentType,
      },
      reason: 'Patient is already part of a family plan',
      existingSubscriptions,
    };
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
