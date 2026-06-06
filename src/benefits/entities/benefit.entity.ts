import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PlanBenefit } from '../../plans/entities/plan-benefit.entity';

@Entity('benefits')
export class Benefit {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Index('IDX_BENEFITS_NAME', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => PlanBenefit, (planBenefit) => planBenefit.benefit)
  planBenefits: PlanBenefit[];

  plansCount?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
