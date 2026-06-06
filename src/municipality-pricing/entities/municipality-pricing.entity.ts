import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity('municipality_pricing')
@Index('IDX_MUNICIPALITY_PRICING_DISPLAY_ORDER', ['displayOrder'])
@Index('IDX_MUNICIPALITY_PRICING_MUNICIPALITY', ['municipality'], {
  unique: true,
})
export class MunicipalityPricing {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Column({ type: 'varchar', length: 100 })
  municipality: string;

  @Column({ type: 'int' })
  displayOrder: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  homeCarePrice: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ambulancePrice: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
