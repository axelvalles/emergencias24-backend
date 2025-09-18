import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { SessionStoreService } from './session-store.service';
import { TwilioService } from 'src/shared/twilio.service';
import { commandProviders } from './commands/command-providers';
import { ClientsModule } from 'src/clients/clients.module';

@Module({
  imports: [ClientsModule],
  controllers: [BotController],
  providers: [
    BotService,
    SessionStoreService,
    TwilioService,
    ...commandProviders,
  ],
})
export class BotModule {}
