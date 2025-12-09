import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanSubscription,
  PlanSubscriptionRole,
} from '../entities/plan-subscription.entity';
import { PlanGroup, PlanGroupType } from '../entities/plan-group.entity';
import { PlanType } from '../entities/plan.entity';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    @InjectRepository(PlanSubscription)
    private readonly planSubscriptionRepository: Repository<PlanSubscription>,
    @InjectRepository(PlanGroup)
    private readonly planGroupRepository: Repository<PlanGroup>,
  ) {}

  async create(
    createPlanSubscriptionDto: Partial<PlanSubscription>,
  ): Promise<PlanSubscription> {
    const subscription = this.planSubscriptionRepository.create(
      createPlanSubscriptionDto,
    );
    return this.planSubscriptionRepository.save(subscription);
  }

  async findAll(): Promise<PlanSubscription[]> {
    return this.planSubscriptionRepository.find({
      relations: ['patient', 'plan_group', 'plan_group.plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PlanSubscription> {
    const subscription = await this.planSubscriptionRepository.findOne({
      where: { id },
      relations: ['patient', 'plan_group', 'plan_group.plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`PlanSubscription with ID ${id} not found`);
    }

    return subscription;
  }

  async findByPatient(patientId: string): Promise<PlanSubscription[]> {
    return this.planSubscriptionRepository.find({
      where: { patient_id: patientId },
      relations: ['plan_group', 'plan_group.plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findByPlanGroup(planGroupId: string): Promise<PlanSubscription[]> {
    return this.planSubscriptionRepository.find({
      where: { plan_group_id: planGroupId },
      relations: ['patient'],
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePlanSubscriptionDto: Partial<PlanSubscription>,
  ): Promise<PlanSubscription> {
    const subscription = await this.findOne(id);

    Object.assign(subscription, updatePlanSubscriptionDto);
    subscription.updated_at = new Date();

    return this.planSubscriptionRepository.save(subscription);
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.planSubscriptionRepository.remove(subscription);
  }

  async subscribePatient(
    planGroupId: string,
    patientId: string,
    role: PlanSubscriptionRole = PlanSubscriptionRole.MEMBER,
    startDate: Date = new Date(),
    endDate?: Date,
  ): Promise<PlanSubscription> {
    const planGroup = await this.planGroupRepository.findOne({
      where: { id: planGroupId },
      relations: ['plan'],
    });

    if (!planGroup) {
      throw new NotFoundException(`PlanGroup with ID ${planGroupId} not found`);
    }

    // Check if patient is already subscribed to this plan group
    const existingSubscription = await this.planSubscriptionRepository.findOne({
      where: { plan_group_id: planGroupId, patient_id: patientId },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        `Patient is already subscribed to this plan group`,
      );
    }

    // Validate role based on group type
    if (planGroup.group_type === PlanGroupType.FAMILY) {
      if (role === PlanSubscriptionRole.MEMBER) {
        role = PlanSubscriptionRole.BENEFICIARY;
      }
      // For family groups, check if there's already a holder
      if (role === PlanSubscriptionRole.HOLDER) {
        const existingHolder = await this.planSubscriptionRepository.findOne({
          where: {
            plan_group_id: planGroupId,
            role: PlanSubscriptionRole.HOLDER,
          },
        });

        if (existingHolder) {
          throw new BadRequestException(
            `Family plan group already has a holder`,
          );
        }
      }
    } else if (planGroup.group_type === PlanGroupType.CORPORATE) {
      if (role !== PlanSubscriptionRole.MEMBER) {
        throw new BadRequestException(
          `Corporate plan groups can only have MEMBER role`,
        );
      }
    }

    // Check minimum/maximum members validation
    if (
      planGroup.plan.plan_type === PlanType.FAMILY ||
      planGroup.group_type === PlanGroupType.FAMILY
    ) {
      const subscriptionCount = await this.planSubscriptionRepository.count({
        where: { plan_group_id: planGroupId },
      });

      const maxMembers = planGroup.plan.min_members || 3;
      if (subscriptionCount >= maxMembers) {
        throw new BadRequestException(
          `Plan group cannot have more than ${maxMembers} members`,
        );
      }
    }

    const subscription = this.planSubscriptionRepository.create({
      plan_group_id: planGroupId,
      patient_id: patientId,
      role,
      start_date: startDate,
      end_date: endDate,
    });

    return this.planSubscriptionRepository.save(subscription);
  }

  async unsubscribePatient(
    planGroupId: string,
    patientId: string,
  ): Promise<void> {
    const subscription = await this.planSubscriptionRepository.findOne({
      where: { plan_group_id: planGroupId, patient_id: patientId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Patient is not subscribed to this plan group`,
      );
    }

    // Cannot remove holder if there are other members in family group
    if (subscription.role === PlanSubscriptionRole.HOLDER) {
      const planGroup = await this.planGroupRepository.findOne({
        where: { id: planGroupId },
      });

      if (planGroup && planGroup.group_type === PlanGroupType.FAMILY) {
        const subscriptionCount = await this.planSubscriptionRepository.count({
          where: { plan_group_id: planGroupId },
        });

        if (subscriptionCount > 1) {
          throw new BadRequestException(
            `Cannot remove holder while there are other family members`,
          );
        }
      }
    }

    await this.planSubscriptionRepository.remove(subscription);
  }
}
