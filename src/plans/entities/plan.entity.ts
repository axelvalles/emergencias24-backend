// src/plans/entities/plan.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { PrivatePlan } from './private-plan.entity';
import { CorporatePlan } from './corporate-plan.entity';

export enum PlanType {
  PRIVATE = 'Private',
  CORPORATE = 'Corporate',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  plan_id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  plan_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  plan_type: PlanType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthly_cost: number;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string;

  // --- Relationships ---

  // A plan can have many subscriptions.
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  // Relationship to private plan details.
  @OneToOne(() => PrivatePlan, (privatePlan) => privatePlan.plan)
  private_plan_details: PrivatePlan;

  // Relationship to corporate plan details.
  @OneToOne(() => CorporatePlan, (corporatePlan) => corporatePlan.plan)
  corporate_plan_details: CorporatePlan;
}
