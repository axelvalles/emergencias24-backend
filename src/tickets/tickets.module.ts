import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsGateway } from './tickets.gateway';
import { Ticket } from './entities/ticket.entity';
import { TicketStatusHistory } from './entities/ticket-status-history.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketStatusHistory]),
    UsersModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}
