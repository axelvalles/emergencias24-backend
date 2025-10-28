import { ClinicalRecord } from 'src/clinical-records/entities/clinical-record.entity';
import { Specialty } from 'src/specialties/entities/specialty.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity('doctors')
export class Doctor {
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

  @Column({ type: 'varchar', length: 50, unique: true })
  license_number: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  qualifications: string;

  @Column({ type: 'int', nullable: true })
  years_of_experience: number;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  office_address: string;

  @Column({ type: 'time', nullable: true })
  consultation_hours_start: string;

  @Column({ type: 'time', nullable: true })
  consultation_hours_end: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consultation_fee: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

  // --- Relationships ---

  // Many doctors belong to one specialty.
  @ManyToOne(() => Specialty, (specialty) => specialty.doctors)
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  // A doctor can have many clinical records.
  @OneToMany(() => ClinicalRecord, (record) => record.doctor)
  clinical_records: ClinicalRecord[];
}
