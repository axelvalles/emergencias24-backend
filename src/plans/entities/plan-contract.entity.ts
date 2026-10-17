import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { IndividualPayer } from '../../individual-payers/entities/individual-payer.entity';
import { Plan, PlanBillingPeriod } from './plan.entity';
import { PlanSubscription } from './plan-subscription.entity';

export enum PlanContractStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
}

@Entity('plan_contracts')
@Index('IDX_PLAN_CONTRACTS_PAYER_STATUS', ['individualPayer', 'status'])
@Index('IDX_PLAN_CONTRACTS_PLAN_STATUS', ['plan', 'status'])
export class PlanContract {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @ManyToOne(() => IndividualPayer, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'individualPayerId' })
  individualPayer: IndividualPayer;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @OneToMany(() => PlanSubscription, (subscription) => subscription.contract)
  subscriptions: PlanSubscription[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fixedPrice: string;

  @Column({
    type: 'enum',
    enum: PlanBillingPeriod,
    enumName: 'plans_billingperiod_enum',
  })
  billingPeriod: PlanBillingPeriod;

  @Column({ type: 'integer' })
  capacity: number;

  @Column({
    type: 'enum',
    enum: PlanContractStatus,
    default: PlanContractStatus.ACTIVE,
  })
  status: PlanContractStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
