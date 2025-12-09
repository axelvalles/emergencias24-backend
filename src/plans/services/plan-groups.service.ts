import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanGroup, PlanGroupType } from '../entities/plan-group.entity';
import {
  PlanSubscription,
  PlanSubscriptionRole,
} from '../entities/plan-subscription.entity';

@Injectable()
export class PlanGroupsService {
  constructor(
    @InjectRepository(PlanGroup)
    private readonly planGroupRepository: Repository<PlanGroup>,
    @InjectRepository(PlanSubscription)
    private readonly planSubscriptionRepository: Repository<PlanSubscription>,
  ) {}

  async create(createPlanGroupDto: Partial<PlanGroup>): Promise<PlanGroup> {
    const planGroup = this.planGroupRepository.create(createPlanGroupDto);
    return this.planGroupRepository.save(planGroup);
  }

  async findAll(): Promise<PlanGroup[]> {
    return this.planGroupRepository.find({
      relations: ['plan', 'subscriptions'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PlanGroup> {
    const planGroup = await this.planGroupRepository.findOne({
      where: { id },
      relations: ['plan', 'subscriptions', 'subscriptions.patient'],
    });

    if (!planGroup) {
      throw new NotFoundException(`PlanGroup with ID ${id} not found`);
    }

    return planGroup;
  }

  async update(
    id: string,
    updatePlanGroupDto: Partial<PlanGroup>,
  ): Promise<PlanGroup> {
    const planGroup = await this.findOne(id);

    Object.assign(planGroup, updatePlanGroupDto);
    planGroup.updated_at = new Date();

    return this.planGroupRepository.save(planGroup);
  }

  async remove(id: string): Promise<void> {
    const planGroup = await this.findOne(id);
    await this.planGroupRepository.remove(planGroup);
  }

  async addMember(
    planGroupId: string,
    patientId: string,
    startDate: Date = new Date(),
    endDate?: Date,
  ): Promise<PlanSubscription> {
    const planGroup = await this.planGroupRepository.findOne({
      where: { id: planGroupId },
    });

    if (!planGroup) {
      throw new NotFoundException(`PlanGroup with ID ${planGroupId} not found`);
    }

    // Determine role based on group type
    let role = PlanSubscriptionRole.MEMBER;
    if (planGroup.group_type === PlanGroupType.FAMILY) {
      role = PlanSubscriptionRole.BENEFICIARY;
    }

    // Check if patient is already subscribed
    const existingSubscription = await this.planSubscriptionRepository.findOne({
      where: { plan_group_id: planGroupId, patient_id: patientId },
    });

    if (existingSubscription) {
      throw new NotFoundException(
        `Patient is already subscribed to this plan group`,
      );
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

  async removeMember(planGroupId: string, patientId: string): Promise<void> {
    const subscription = await this.planSubscriptionRepository.findOne({
      where: { plan_group_id: planGroupId, patient_id: patientId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Patient is not subscribed to this plan group`,
      );
    }

    await this.planSubscriptionRepository.remove(subscription);
  }
}
