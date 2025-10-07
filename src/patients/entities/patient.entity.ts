import { ClinicalRecord } from 'src/clinical-records/entities/clinical-record.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  patient_id: number;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'date' })
  date_of_birth: Date;

  @Column({ type: 'varchar', length: 50 })
  gender: string;

  @Column({ type: 'varchar', length: 50 })
  document_type: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  document_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // --- Relationships ---

  // A patient can have many subscriptions.
  @OneToMany(() => Subscription, (subscription) => subscription.patient)
  subscriptions: Subscription[];

  // A patient can have many clinical records.
  @OneToMany(() => ClinicalRecord, (record) => record.patient)
  clinical_records: ClinicalRecord[];
}
