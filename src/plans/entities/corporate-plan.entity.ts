// src/plans/entities/corporate-plan.entity.ts

import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  BeforeInsert,
} from 'typeorm';
import { Plan } from './plan.entity';
import { uuidv7 } from 'uuidv7';

@Entity('corporate_plans')
export class CorporatePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'varchar', length: 200 })
  company_name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  company_tax_id: string; // RUC in some countries

  @Column({ type: 'varchar', length: 150, nullable: true })
  company_contact: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company_email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  company_phone: string;

  @Column({ type: 'int', nullable: true })
  number_of_employees: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  employee_contribution_percentage: number;

  // --- Relationships ---
  @OneToOne(() => Plan, (plan) => plan.corporate_plan_details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
