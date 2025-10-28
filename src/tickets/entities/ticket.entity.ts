import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { uuidv7 } from 'uuidv7';

export enum ServiceType {
  IMMEDIATE_ATTENTION = 'immediate_attention',
  TELEMEDICINE = 'telemedicine',
  HOME_CARE = 'home_care',
  MEDICAL_CONSULTATION = 'medical_consultation',
  AMBULANCE = 'ambulance',
  LABORATORY = 'laboratory',
  APPOINTMENT = 'appointment',
}

export enum TicketStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'int', unique: true, generated: 'increment' })
  referenceNumber: number;

  @Column({
    type: 'enum',
    enum: ServiceType,
    nullable: false,
  })
  serviceType: ServiceType;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ nullable: true })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: false })
  requesterPhone: string;

  @Column({ type: 'text', nullable: true })
  requesterName: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  municipality: string;

  @Column({ type: 'text', nullable: true })
  speciality: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  assignedTo: string; // ID del operador asignado

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
