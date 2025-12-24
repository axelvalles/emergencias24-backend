import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Patient } from '../../patients/entities/patient.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('companies')
export class Company {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Index('IDX_COMPANIES_NAME')
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index('IDX_COMPANIES_TAX_ID', { unique: true })
  @Column({ type: 'varchar', length: 50 })
  taxId: string;

  @Index('IDX_COMPANIES_CONTACT_EMAIL')
  @Column({ type: 'varchar', length: 255 })
  contactEmail: string;

  @Index('IDX_COMPANIES_CONTACT_PHONE')
  @Column({ type: 'varchar', length: 20 })
  contactPhone: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  @Index('IDX_COMPANIES_CREATED_AT')
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @OneToMany(() => Patient, (patient) => patient.company)
  patients: Patient[];
}
