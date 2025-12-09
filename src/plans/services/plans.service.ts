import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanStatus } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: Partial<Plan>): Promise<Plan> {
    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async findAll(): Promise<Plan[]> {
    return this.planRepository.find({
      relations: ['groups'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['groups'],
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: string, updatePlanDto: Partial<Plan>): Promise<Plan> {
    const plan = await this.findOne(id);

    Object.assign(plan, updatePlanDto);
    plan.updated_at = new Date();

    return this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);

    // Check if plan has any groups
    if (plan.groups && plan.groups.length > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ID ${id} because it has associated groups`,
      );
    }

    await this.planRepository.remove(plan);
  }

  async deactivate(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.status = PlanStatus.INACTIVE;
    plan.updated_at = new Date();
    return this.planRepository.save(plan);
  }

  async activate(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.status = PlanStatus.ACTIVE;
    plan.updated_at = new Date();
    return this.planRepository.save(plan);
  }
}
