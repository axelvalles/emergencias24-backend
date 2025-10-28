// src/plans/entities/plan.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { PrivatePlan } from './private-plan.entity';
import { CorporatePlan } from './corporate-plan.entity';
import { uuidv7 } from 'uuidv7';

export enum PlanType {
  PRIVATE = 'Private',
  CORPORATE = 'Corporate',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

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

  @Column({ type: 'int', default: 1 })
  coverage_period_months: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deductible: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  copayment: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  coinsurance: number;

  @Column({ type: 'int', nullable: true })
  max_annual_coverage: number;

  @Column({ type: 'text', nullable: true })
  coverage_details: string;

  @Column({ type: 'text', nullable: true })
  exclusions: string;

  @Column({ type: 'date', nullable: true })
  effective_date: Date;

  @Column({ type: 'date', nullable: true })
  expiration_date: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

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
