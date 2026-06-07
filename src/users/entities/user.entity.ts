import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Exclude, Expose } from 'class-transformer';
import { AmbulanceUnit } from 'src/ambulance-units/entities/ambulance-unit.entity';

export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  DISPATCHER = 'dispatcher',
  AMBULANCE = 'ambulance',
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
    default: UserRole.ADMIN,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ManyToMany(() => AmbulanceUnit, (ambulanceUnit) => ambulanceUnit.members)
  ambulanceUnits: AmbulanceUnit[];

  @ManyToOne(() => AmbulanceUnit, (ambulanceUnit) => ambulanceUnit.activeUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'activeAmbulanceUnitId' })
  activeAmbulanceUnit?: AmbulanceUnit | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  passwordResetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt?: Date | null;

  // --- Calculated ---
  @Expose()
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
