import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { SessionStoreService } from './session-store.service';
import { PatientsModule } from 'src/patients/patients.module';
import { MessagingModule } from 'src/shared/messaging/messaging.module';

@Module({
  imports: [PatientsModule, MessagingModule],
  controllers: [BotController],
  providers: [BotService, SessionStoreService],
})
export class BotModule {}
