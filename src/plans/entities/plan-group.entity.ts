import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Plan } from './plan.entity';
import { PlanSubscription } from './plan-subscription.entity';

export enum PlanGroupType {
  FAMILY = 'FAMILY',
  CORPORATE = 'CORPORATE',
}

@Entity('plan_groups')
export class PlanGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'uuid' })
  plan_id: string;

  @Column({
    type: 'enum',
    enum: PlanGroupType,
  })
  group_type: PlanGroupType;

  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  @Column({ type: 'uuid', nullable: true })
  holder_id: string;

  @Column({ type: 'varchar', length: 255 })
  entity_name: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  // --- Relationships ---
  @OneToMany(() => PlanSubscription, (subscription) => subscription.plan_group)
  subscriptions: PlanSubscription[];
}
