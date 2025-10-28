import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CLINIC_ADMIN = 'clinic_admin',
  OPERATOR = 'operator',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  LAB_ADMIN = 'lab_admin',
  FINANCE = 'finance',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.CLINIC_ADMIN],
  })
  roles: UserRole[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  // Methods
  async hashPassword(): Promise<void> {
    if (this.password_hash) {
      const saltRounds = 10;

      this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch {
      return false;
    }
  }
}
