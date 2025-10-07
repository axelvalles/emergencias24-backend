// src/clinical-records/entities/clinical-record.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';

@Entity('clinical_records')
export class ClinicalRecord {
  @PrimaryGeneratedColumn()
  record_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  appointment_date: Date;

  @Column({ type: 'text' })
  reason_for_visit: string;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'int', nullable: true }) // Optional, if you have a Doctor entity
  doctor_id: number;

  // --- Relationships ---

  // Many clinical records belong to one patient.
  @ManyToOne(() => Patient, (patient) => patient.clinical_records)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
