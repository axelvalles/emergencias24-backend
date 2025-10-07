// src/subscriptions/entities/subscription.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Plan } from '../../plans/entities/plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  subscription_id: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  subscription_status: string;

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
