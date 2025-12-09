import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PlanGroup } from './plan-group.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum PlanSubscriptionRole {
  HOLDER = 'HOLDER',
  BENEFICIARY = 'BENEFICIARY',
  MEMBER = 'MEMBER',
}

export enum PlanSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

@Entity('plan_subscriptions')
export class PlanSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => PlanGroup)
  @JoinColumn({ name: 'plan_group_id' })
  plan_group: PlanGroup;

  @Column({ type: 'uuid' })
  plan_group_id: string;

  @Column({
    type: 'enum',
    enum: PlanSubscriptionRole,
  })
  role: PlanSubscriptionRole;

  @Column({
    type: 'enum',
    enum: PlanSubscriptionStatus,
    default: PlanSubscriptionStatus.ACTIVE,
  })
  status: PlanSubscriptionStatus;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthly_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  annual_cost: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
