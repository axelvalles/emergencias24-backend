import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsGateway } from './tickets.gateway';
import { Ticket } from './entities/ticket.entity';
import { TicketStatusHistory } from './entities/ticket-status-history.entity';
import { UsersModule } from 'src/users/users.module';
import { AmbulanceUnitsModule } from 'src/ambulance-units/ambulance-units.module';
import { TicketRoutingPolicy } from './ticket-routing.policy';
import { TicketRoleHandoff } from './entities/ticket-role-handoff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketStatusHistory, TicketRoleHandoff]),
    UsersModule,
    AmbulanceUnitsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway, TicketRoutingPolicy],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}
