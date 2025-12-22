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
import { Exclude, Expose } from 'class-transformer';

export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  CLINIC_ADMIN = 'clinicAdmin',
  OPERATOR = 'operator',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  LABADMIN = 'labAdmin',
  FINANCE = 'finance',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
@Entity('users')
@Index('IDX_USERS_STATUS', ['status'])
@Index('IDX_USERS_ROLE_STATUS', ['role', 'status'])
export class User {
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

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLINIC_ADMIN,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  // --- Calculated ---
  @Expose()
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
