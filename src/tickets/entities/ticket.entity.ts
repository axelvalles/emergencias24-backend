import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  BeforeInsert,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { uuidv7 } from 'uuidv7';
import { AmbulanceUnit } from 'src/ambulance-units/entities/ambulance-unit.entity';
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from '../ticket-owner-role';

export enum ServiceType {
  IMMEDIATE_ATTENTION = 'immediate_attention',
  TELEMEDICINE = 'telemedicine',
  HOME_CARE = 'home_care',
  MEDICAL_CONSULTATION = 'medical_consultation',
  AMBULANCE = 'ambulance',
  LABORATORY = 'laboratory',
  STUDY_TRANSFER = 'study_transfer',
  IMAGING = 'imaging',
  APPOINTMENT = 'appointment',
  EQUIPMENT_RENTAL = 'equipment_rental',
  PLANS = 'plans',
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
}

@Entity('tickets')
@Index('IDX_TICKETS_STATUS_CREATED', ['status', 'createdAt'])
@Index('IDX_TICKETS_ASSIGNED', ['assignedUnit', 'status'])
@Index('IDX_TICKETS_OWNER_ROLE_STATUS', ['currentOwnerRole', 'status'])
@Index('IDX_TICKETS_OWNER_ROLE_CREATED', ['currentOwnerRole', 'createdAt'])
@Index('IDX_TICKETS_PATIENT', ['patient'])
export class Ticket {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Column({ type: 'int', generated: 'increment' })
  referenceNumber: number;

  @Column({
    type: 'enum',
    enum: ServiceType,
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

  @Column({
    type: 'enum',
    enum: TICKET_OWNER_ROLE,
    nullable: true,
  })
  currentOwnerRole?: TicketOwnerRole | null;

  @ManyToOne(() => Patient, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  patient?: Patient | null;

  @Column()
  requesterPhone: string;

  @Column({ type: 'text', nullable: true })
  requesterName?: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  municipality?: string;

  @Column({ type: 'text', nullable: true })
  speciality?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @ManyToOne(() => AmbulanceUnit, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  assignedUnit?: AmbulanceUnit | null;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
