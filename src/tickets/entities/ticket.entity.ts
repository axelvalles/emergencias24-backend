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
import { User } from 'src/users/entities/user.entity';

export enum ServiceType {
  IMMEDIATE_ATTENTION = 'immediate_attention',
  TELEMEDICINE = 'telemedicine',
  HOME_CARE = 'home_care',
  MEDICAL_CONSULTATION = 'medical_consultation',
  AMBULANCE = 'ambulance',
  LABORATORY = 'laboratory',
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
@Index('IDX_TICKETS_ASSIGNED', ['assignedUser', 'status'])
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

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  assignedUser?: User | null;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
