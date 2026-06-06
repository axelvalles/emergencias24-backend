import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PlanBenefit } from './plan-benefit.entity';
import { PlanSubscription } from './plan-subscription.entity';

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PlanType {
  FAMILY = 'FAMILY',
  CORPORATE = 'CORPORATE',
  GROUP = 'GROUP',
}

export enum PlanBillingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
}

@Entity('plans')
export class Plan {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  /* =====================
     Reglas de cobertura
     ===================== */

  @Index('IDX_PLANS_NAME')
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index('IDX_PLANS_PLAN_TYPE')
  @Column({
    type: 'enum',
    enum: PlanType,
  })
  planType: PlanType;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyCost: string;

  @Column({
    type: 'enum',
    enum: PlanBillingPeriod,
    default: PlanBillingPeriod.MONTHLY,
  })
  billingPeriod: PlanBillingPeriod;

  @Column({ type: 'text', nullable: true })
  benefitsNotes: string | null;

  @OneToMany(() => PlanBenefit, (planBenefit) => planBenefit.plan)
  planBenefits: PlanBenefit[];

  @OneToMany(() => PlanSubscription, (subscription) => subscription.plan)
  subscriptions: PlanSubscription[];

  activeSubscriptionsCount?: number;

  benefitsCount?: number;

  /* =====================
     Auditoría
     ===================== */

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
