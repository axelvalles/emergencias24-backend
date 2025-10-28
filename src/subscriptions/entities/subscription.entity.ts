// src/subscriptions/entities/subscription.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { uuidv7 } from 'uuidv7';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  subscription_status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_reference: string;

  @Column({ type: 'date', nullable: true })
  last_payment_date: Date;

  @Column({ type: 'date', nullable: true })
  next_payment_date: Date;

  @Column({ type: 'boolean', default: false })
  auto_renewal: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

  // --- Relationships ---

  // Many subscriptions belong to one patient.
  @ManyToOne(() => Patient, (patient) => patient.subscriptions)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  // Many subscriptions belong to one plan.
  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // Relationship for Holder/Beneficiaries (Self-referencing)
  @ManyToOne(() => Subscription, (subscription) => subscription.beneficiaries, {
    nullable: true,
  })
  @JoinColumn({ name: 'holder_subscription_id' })
  holder: Subscription; // The main holder of this subscription (if it's a beneficiary)

  @OneToMany(() => Subscription, (subscription) => subscription.holder)
  beneficiaries: Subscription[]; // List of beneficiaries under this subscription (if it's a holder)
}
