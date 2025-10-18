import { User } from 'src/users/entities/user.entity';
import { ClinicalRecord } from 'src/clinical-records/entities/clinical-record.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  // Relationship with User
  @OneToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'varchar', length: 50 })
  gender: string;

  @Column({ type: 'varchar', length: 50 })
  document_type: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  document_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zip_code: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  secondary_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emergency_contact_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergency_contact_phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  blood_type: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ type: 'text', nullable: true })
  medical_conditions: string;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  patient_status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  medical_record_number: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

  // --- Relationships ---

  // A patient can have many subscriptions.
  @OneToMany(() => Subscription, (subscription) => subscription.patient, {
    cascade: true,
  })
  subscriptions: Subscription[];

  // A patient can have many clinical records.
  @OneToMany(() => ClinicalRecord, (record) => record.patient)
  clinical_records: ClinicalRecord[];

  // --- Calculated ---
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }
}
