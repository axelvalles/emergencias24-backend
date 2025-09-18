import { Injectable } from '@nestjs/common';
import { ChatCommand } from '../interfaces/chat-command.interface';
import { TwilioService } from 'src/shared/twilio.service';
import { BotSession } from '../interfaces/bot-session.interface';
import { TwilioWebhookDto } from '../dto/twilio-webhook.dto';
import { FlowState } from '../interfaces/flows.enum';

@Injectable()
export class WelcomeCommand implements ChatCommand {
  constructor(private readonly twilio: TwilioService) {}

  async execute(payload: TwilioWebhookDto, session: BotSession) {
    await this.twilio.sendTemplate(
      payload.From,
      'HX37b03e9cb14f8bc377a12be39dcfb3b2',
    );
    session.state = FlowState.WAITING_MAIN_MENU;
  }
}
