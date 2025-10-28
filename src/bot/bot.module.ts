import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { SessionStoreService } from './session-store.service';
import { PatientsModule } from 'src/patients/patients.module';
import { MessagingModule } from 'src/shared/messaging/messaging.module';
import { TicketsModule } from 'src/tickets/tickets.module';

@Module({
  imports: [PatientsModule, MessagingModule, TicketsModule],
  controllers: [BotController],
  providers: [BotService, SessionStoreService],
})
export class BotModule {}
