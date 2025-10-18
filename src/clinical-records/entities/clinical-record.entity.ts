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
import { Doctor } from '../../doctors/entities/doctor.entity';

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

  // Remove the old doctor_id column since we'll use a proper relationship

  @Column({ type: 'varchar', length: 100, nullable: true })
  appointment_type: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight_kg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height_cm: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  blood_pressure: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature_celsius: number;

  @Column({ type: 'int', nullable: true })
  heart_rate_bpm: number;

  @Column({ type: 'text', nullable: true })
  prescribed_medications: string;

  @Column({ type: 'text', nullable: true })
  lab_results: string;

  @Column({ type: 'date', nullable: true })
  follow_up_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'Completed' })
  appointment_status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consultation_fee: number;

  @Column({ type: 'text', nullable: true })
  additional_notes: string;

  // --- Relationships ---

  // Many clinical records belong to one patient.
  @ManyToOne(() => Patient, (patient) => patient.clinical_records)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  // Many clinical records belong to one doctor.
  @ManyToOne(() => Doctor, (doctor) => doctor.clinical_records)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;
}
