import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Benefit } from '../../benefits/entities/benefit.entity';
import { Plan } from './plan.entity';

export enum PlanBenefitValueType {
  QUANTITY = 'QUANTITY',
  DISCOUNT = 'DISCOUNT',
}

@Entity('plan_benefits')
@Index('IDX_PLAN_BENEFITS_PLAN_BENEFIT', ['planId', 'benefitId'], {
  unique: true,
})
export class PlanBenefit {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'uuid' })
  benefitId: string;

  @Column({
    type: 'enum',
    enum: PlanBenefitValueType,
  })
  valueType: PlanBenefitValueType;

  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @Column({ type: 'boolean', default: false })
  isUnlimited: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: string | null;

  @ManyToOne(() => Plan, (plan) => plan.planBenefits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @ManyToOne(() => Benefit, (benefit) => benefit.planBenefits, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'benefitId' })
  benefit: Benefit;
}
