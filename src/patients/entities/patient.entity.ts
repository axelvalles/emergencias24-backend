import {
  Entity,
  Column,
  CreateDateColumn,
  BeforeInsert,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { PlanSubscription } from '../../plans/entities/plan-subscription.entity';
import { Expose } from 'class-transformer';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum PatientStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  DECEASED = 'Deceased',
}

export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
  NIT = 'NIT',
  OTHER = 'OTHER',
}

@Entity('patients')
export class Patient {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 50, unique: true })
  documentNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zipCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  secondaryPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emergencyContactName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone: string;

  @Column({
    type: 'enum',
    enum: BloodType,
    nullable: true,
  })
  bloodType: BloodType;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ type: 'text', nullable: true })
  medicalConditions: string;

  @Column({
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.ACTIVE,
  })
  status: PatientStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  // --- Relationships ---
  @OneToMany(() => PlanSubscription, (subscription) => subscription.patient)
  subscriptions: PlanSubscription[];

  // --- Calculated ---
  @Expose()
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
