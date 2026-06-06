import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { SessionStoreService } from './session-store.service';
import { TwilioWebhookGuard } from './twilio-webhook.guard';
import { PatientsModule } from 'src/patients/patients.module';
import { MessagingModule } from 'src/shared/messaging/messaging.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { MunicipalityPricingModule } from 'src/municipality-pricing/municipality-pricing.module';

@Module({
  imports: [
    PatientsModule,
    MessagingModule,
    TicketsModule,
    MunicipalityPricingModule,
  ],
  controllers: [BotController],
  providers: [BotService, SessionStoreService, TwilioWebhookGuard],
})
export class BotModule {}
