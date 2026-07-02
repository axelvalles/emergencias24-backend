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
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from '../ticket-owner-role';

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

  @Column({
    type: 'enum',
    enum: TICKET_OWNER_ROLE,
    nullable: true,
  })
  ownerRoleAtChange?: TicketOwnerRole | null;

  @Column({ type: 'uuid', nullable: true })
  assignedUnitIdSnapshot?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
