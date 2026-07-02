import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Ticket } from './ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from '../ticket-owner-role';

@Entity('ticket_role_handoffs')
export class TicketRoleHandoff {
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
    enum: TICKET_OWNER_ROLE,
    nullable: true,
  })
  fromOwnerRole?: TicketOwnerRole | null;

  @Column({
    type: 'enum',
    enum: TICKET_OWNER_ROLE,
  })
  toOwnerRole: TicketOwnerRole;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  changedBy?: User | null;

  @Column({ type: 'uuid', nullable: true })
  fromAssignedUnitId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  toAssignedUnitId?: string | null;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
