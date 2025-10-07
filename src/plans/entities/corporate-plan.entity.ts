// src/plans/entities/corporate-plan.entity.ts

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Plan } from './plan.entity';

@Entity('corporate_plans')
export class CorporatePlan {
  @PrimaryColumn()
  plan_id: number;

  @Column({ type: 'varchar', length: 200 })
  company_name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  company_tax_id: string; // RUC in some countries

  @Column({ type: 'varchar', length: 150, nullable: true })
  company_contact: string;

  // --- Relationships ---
  @OneToOne(() => Plan, (plan) => plan.corporate_plan_details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
