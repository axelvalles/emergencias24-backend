import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';
import { Ticket, TicketStatus } from './ticket.entity';
import { User } from '../../users/entities/user.entity';
import { uuidv7 } from 'uuidv7';

@Entity('ticket_status_history')
export class TicketStatusHistory {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  ticket: Ticket;

  @Column({
    type: 'enum',
    enum: TicketStatus,
  })
  status: TicketStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  changedBy?: User | null;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;
}
