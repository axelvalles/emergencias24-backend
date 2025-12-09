import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PlanGroup } from './plan-group.entity';

export enum PlanType {
  FAMILY = 'FAMILY',
  GROUP = 'GROUP',
}

export enum GroupCategory {
  EMPRESARIAL = 'EMPRESARIAL',
  COLECTIVO = 'COLECTIVO',
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
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

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  plan_type: PlanType;

  @Column({
    type: 'enum',
    enum: GroupCategory,
    nullable: true,
  })
  group_category: GroupCategory;

  @Column({ type: 'int', nullable: true })
  min_members: number;

  @Column({ type: 'json' })
  benefits: object;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthly_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  annual_cost: number;

  @Column({ type: 'date', nullable: true })
  valid_from: Date;

  @Column({ type: 'date', nullable: true })
  valid_until: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  // --- Relationships ---
  @OneToMany(() => PlanGroup, (group) => group.plan)
  groups: PlanGroup[];
}
