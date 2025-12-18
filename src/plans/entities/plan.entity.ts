import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PlanType {
  FAMILY = 'FAMILY',
  CORPORATE = 'CORPORATE',
}

export interface PlanBenefits {
  consultations: boolean;
  emergencyCoverage: boolean;
  dental: boolean;
  optometry?: boolean;
  notes?: string;
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

  @Column({ type: 'jsonb' })
  benefits: PlanBenefits;

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
  monthlyCost: number;

  /* =====================
     Auditoría
     ===================== */

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
