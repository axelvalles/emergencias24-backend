import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Patient } from '../../patients/entities/patient.entity';
import { Plan } from './plan.entity';
import { Company } from 'src/companies/entities/company.entity';

export enum PlanSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PayerType {
  PATIENT = 'PATIENT',
  COMPANY = 'COMPANY',
}

@Entity('plan_subscriptions')
@Index('IDX_PS_PATIENT_ACTIVE', ['patient', 'status', 'startDate', 'endDate'])
@Index('IDX_PS_COMPANY_ACTIVE', ['company', 'status'])
export class PlanSubscription {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }
  /* =====================
     Relaciones
     ===================== */

  @ManyToOne(() => Patient, { nullable: false, onDelete: 'RESTRICT' })
  patient: Patient;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'RESTRICT' })
  plan: Plan;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  company?: Company | null;

  /* =====================
     Reglas de cobertura
     ===================== */

  @Column({
    type: 'enum',
    enum: PlanSubscriptionStatus,
    default: PlanSubscriptionStatus.ACTIVE,
  })
  status: PlanSubscriptionStatus;

  @Column({
    type: 'enum',
    enum: PayerType,
  })
  payerType: PayerType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date | null;

  /* =====================
     Auditoría
     ===================== */

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
