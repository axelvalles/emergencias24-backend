// src/plans/entities/private-plan.entity.ts

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Plan } from './plan.entity';

@Entity('private_plans')
export class PrivatePlan {
  @PrimaryColumn()
  plan_id: number;

  @Column({ type: 'varchar', length: 100 })
  category: string; // e.g., "Family", "Individual", "Telemedicine"

  @Column({ type: 'int', default: 1 })
  max_beneficiaries: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  family_discount: number;

  @Column({ type: 'boolean', default: false })
  includes_preventive_care: boolean;

  @Column({ type: 'boolean', default: false })
  includes_dental: boolean;

  @Column({ type: 'boolean', default: false })
  includes_vision: boolean;

  // --- Relationships ---
  @OneToOne(() => Plan, (plan) => plan.private_plan_details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
