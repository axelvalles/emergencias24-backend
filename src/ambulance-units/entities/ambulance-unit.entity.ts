import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { User } from 'src/users/entities/user.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';

@Entity('ambulance_units')
@Index('IDX_AMBULANCE_UNITS_NAME', ['name'], { unique: true })
export class AmbulanceUnit {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateUuid() {
    this.id = uuidv7();
  }

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToMany(() => User, (user) => user.ambulanceUnits)
  @JoinTable({
    name: 'ambulance_unit_members',
    joinColumn: { name: 'ambulanceUnitId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => User, (user) => user.activeAmbulanceUnit)
  activeUsers: User[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignedUnit)
  assignedTickets: Ticket[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
